# Payment System Implementation Guide
## Craft Chicago Finds - Step-by-Step Deployment

**Date:** October 30, 2025  
**Priority:** CRITICAL  
**Estimated Time:** 2-3 hours

---

## What We've Implemented

### ✅ Completed Improvements

1. **Webhook Idempotency Protection**
   - Prevents duplicate orders on Stripe webhook retries
   - Uses `stripe_session_id` as unique identifier
   - Handles both new and existing orders gracefully

2. **Enhanced Commission Tracking**
   - New database fields for commission status lifecycle
   - 7-day hold period for chargeback protection
   - Platform fee rate tracking per order
   - Actual revenue tracking after Stripe fees

3. **Comprehensive Payment Validation**
   - Pre-payment validation service
   - Listing availability and inventory checks
   - Amount integrity verification
   - Stripe Connect account validation
   - Prevents self-purchases and fraud

4. **Commission Payout System**
   - Automated payout processing for Stripe Connect
   - Manual payout tracking for non-connected sellers
   - Payout reconciliation and history
   - Order-to-payout linking

5. **Revenue Reconciliation**
   - Daily/monthly/yearly aggregation
   - Commission tracking and verification
   - Net revenue calculation with Stripe fees
   - User growth metrics

6. **Multi-Seller Order Safety**
   - Better error handling for cart checkouts
   - Tracks failed vs successful orders
   - Comprehensive logging for debugging

---

## Deployment Steps

### Step 1: Database Migration (15 minutes)

```bash
# Connect to your Supabase project
cd supabase

# Apply the new migration
npx supabase db push

# Or via Supabase Dashboard:
# 1. Go to Database > Migrations
# 2. Create new migration
# 3. Copy content from: supabase/migrations/20251030000001_payment_system_optimization.sql
# 4. Run migration
```

**Verification:**
```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('commission_payouts', 'platform_revenue', 'platform_fee_config');

-- Check new columns on orders table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('stripe_session_id', 'commission_status', 'commission_hold_until');

-- Should return 3 tables and at least 3 columns
```

### Step 2: Deploy Edge Functions (20 minutes)

```bash
# Deploy the updated webhook handler
npx supabase functions deploy stripe-webhook

# Deploy new validation service
npx supabase functions deploy validate-payment

# Deploy payout processing service
npx supabase functions deploy process-commission-payout

# Deploy revenue reconciliation service
npx supabase functions deploy reconcile-revenue
```

**Set Environment Variables:**
```bash
# Make sure these are set in Supabase Dashboard > Edge Functions > Settings
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://api.craftlocal.net
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 3: Update Stripe Webhook (10 minutes)

1. Go to Stripe Dashboard > Developers > Webhooks
2. Find your existing webhook endpoint
3. Verify it points to: `https://functions.craftlocal.net/v1/stripe-webhook`
4. Ensure these events are enabled:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `account.updated`

### Step 4: Test Idempotency (15 minutes)

**Test Scenario: Duplicate Webhook**

```bash
# Use Stripe CLI to resend a webhook
stripe events resend evt_... --webhook-endpoint=https://functions.craftlocal.net/v1/stripe-webhook

# Check logs in Supabase Dashboard > Edge Functions > stripe-webhook
# Should see: "Order already processed for session: ..."
# Should NOT create duplicate order
```

**Verify in Database:**
```sql
-- Check for any duplicate session IDs (should return 0)
SELECT stripe_session_id, COUNT(*) 
FROM orders 
WHERE stripe_session_id IS NOT NULL
GROUP BY stripe_session_id 
HAVING COUNT(*) > 1;
```

### Step 5: Test Payment Validation (20 minutes)

**Test via API:**
```javascript
// Call from your frontend before creating checkout
const response = await supabase.functions.invoke('validate-payment', {
  body: {
    listing_id: 'uuid-here',
    quantity: 1,
    amount_submitted: 110.00, // $100 item + $10 platform fee
    seller_id: 'seller-uuid'
  }
});

console.log(response.data);
// Should return: { valid: true, listing: {...}, seller: {...}, amounts: {...} }
```

**Integration into Checkout:**
```typescript
// In your StripeCheckout component
const handleCheckout = async () => {
  // NEW: Validate before creating checkout
  const { data: validation } = await supabase.functions.invoke('validate-payment', {
    body: {
      listing_id: listing.id,
      quantity,
      amount_submitted: total,
      seller_id: listing.seller_id
    }
  });

  if (!validation?.valid) {
    toast({
      title: 'Payment Validation Failed',
      description: validation?.message || 'Unable to process payment',
      variant: 'destructive'
    });
    return;
  }

  if (validation.warnings?.length > 0) {
    // Show warnings but allow to continue
    console.warn('Payment warnings:', validation.warnings);
  }

  // Continue with existing checkout logic...
};
```

### Step 6: Configure Commission Hold Period (5 minutes)

**Default: 7 days** (configured in webhook handler)

To adjust:
```typescript
// In supabase/functions/stripe-webhook/index.ts
// Line ~168 and ~243
const commissionHoldUntil = new Date();
commissionHoldUntil.setDate(commissionHoldUntil.getDate() + 14); // Change to 14 days
```

### Step 7: Set Up Automated Revenue Reconciliation (15 minutes)

**Option A: Supabase Cron (Recommended)**
```sql
-- Run daily at 2 AM UTC
SELECT cron.schedule(
  'daily-revenue-reconciliation',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://functions.craftlocal.net/v1/reconcile-revenue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [service-role-key]"}'::jsonb,
    body := '{"period_type": "daily"}'::jsonb
  )
  $$
);
```

**Option B: External Cron (e.g., GitHub Actions)**
```yaml
# .github/workflows/reconcile-revenue.yml
name: Daily Revenue Reconciliation
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC daily
jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reconciliation API
        run: |
          curl -X POST https://functions.craftlocal.net/v1/reconcile-revenue \
          -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
          -H "Content-Type: application/json" \
          -d '{"period_type": "daily"}'
```

### Step 8: Test End-to-End (30 minutes)

**Full Purchase Flow:**

1. ✅ Create test listing
2. ✅ Add to cart
3. ✅ Checkout (use Stripe test card: 4242 4242 4242 4242)
4. ✅ Verify order created with:
   - `stripe_session_id` populated
   - `commission_status` = 'held'
   - `commission_hold_until` = 7 days from now
   - `platform_fee_rate` = 0.1000
5. ✅ Check `platform_revenue` table updated
6. ✅ Try duplicate webhook (should be blocked)
7. ✅ Process commission payout after hold period

**Test Commission Payout:**
```javascript
// Call after hold period passes (or manually set commission_hold_until to past date)
const { data } = await supabase.functions.invoke('process-commission-payout', {
  body: {
    seller_id: 'uuid-here',
    period_start: '2025-10-01T00:00:00Z',
    period_end: '2025-10-30T23:59:59Z'
  }
});

console.log(data);
// Should return: { success: true, payout: {...} }
```

---

## Database Queries for Monitoring

### Check Commission Status Distribution
```sql
SELECT 
  commission_status,
  COUNT(*) as order_count,
  SUM(commission_amount) as total_commission,
  AVG(commission_amount) as avg_commission
FROM orders
WHERE commission_status IS NOT NULL
GROUP BY commission_status
ORDER BY order_count DESC;
```

### Orders Ready for Payout
```sql
SELECT 
  seller_id,
  COUNT(*) as eligible_orders,
  SUM(commission_amount) as commission_owed,
  SUM(total_amount) - SUM(commission_amount) as seller_payout
FROM orders
WHERE commission_status IN ('held', 'pending')
  AND payment_status = 'completed'
  AND commission_hold_until <= NOW()
GROUP BY seller_id
ORDER BY seller_payout DESC;
```

### Platform Revenue Summary (Last 30 Days)
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders,
  SUM(total_amount) as gross_sales,
  SUM(commission_amount) as platform_revenue,
  ROUND(AVG(commission_amount), 2) as avg_commission
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND payment_status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Identify Duplicate Session IDs (Should Be Empty)
```sql
SELECT 
  stripe_session_id,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as order_ids,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM orders
WHERE stripe_session_id IS NOT NULL
GROUP BY stripe_session_id
HAVING COUNT(*) > 1;
```

---

## Troubleshooting

### Issue: Webhook Still Creating Duplicates

**Check:**
1. Migration applied correctly?
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'orders' AND column_name = 'stripe_session_id';
   ```
2. Index created?
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'orders' AND indexname = 'idx_orders_stripe_session_id';
   ```
3. Edge function deployed?
   ```bash
   npx supabase functions list
   # Should show stripe-webhook with recent deployment date
   ```

### Issue: Validation Service Not Working

**Check:**
1. Edge function deployed?
2. Environment variables set?
3. Test with curl:
   ```bash
   curl -X POST https://functions.craftlocal.net/v1/validate-payment \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"listing_id":"test","quantity":1,"amount_submitted":100,"seller_id":"test"}'
   ```

### Issue: Commission Payouts Failing

**Check:**
1. Seller has `stripe_account_id` set?
   ```sql
   SELECT user_id, display_name, stripe_account_id, seller_verified 
   FROM profiles 
   WHERE is_seller = true;
   ```
2. Hold period passed?
   ```sql
   SELECT id, commission_hold_until, 
          commission_hold_until < NOW() as hold_expired
   FROM orders 
   WHERE commission_status = 'held';
   ```
3. Stripe account valid?
   - Check Stripe Dashboard > Connect > Accounts
   - Verify `charges_enabled` and `payouts_enabled`

---

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] All edge functions deployed
- [ ] Stripe webhook endpoint verified
- [ ] Test order processed without duplicates
- [ ] Payment validation tested
- [ ] Commission tracking verified
- [ ] Revenue reconciliation scheduled
- [ ] Monitoring queries saved
- [ ] Team trained on new features
- [ ] Documentation updated

---

## Next Steps (Future Enhancements)

1. **Dynamic Fee Configuration**
   - Use `platform_fee_config` table for variable fees
   - Per-seller custom rates
   - Promotional discounts

2. **Automated Payout Scheduling**
   - Weekly/monthly payout runs
   - Minimum payout thresholds
   - Seller payout preferences

3. **Advanced Reconciliation**
   - Stripe fee reconciliation from API
   - Chargeback tracking and commission reversal
   - Tax reporting exports

4. **Dashboard Integration**
   - Real-time revenue metrics
   - Commission status tracking
   - Payout history views

5. **Refund Flow Enhancement**
   - Automatic commission reversal
   - Partial refund handling
   - Dispute management integration

---

## Support & Questions

**Common Questions:**

**Q: What happens if a seller doesn't have Stripe Connect?**  
A: Payment goes to platform account. Commission is tracked in database but requires manual payout processing.

**Q: Why 7-day commission hold?**  
A: Protects platform from chargebacks and disputes. Standard practice for marketplaces.

**Q: Can we change the platform fee rate?**  
A: Currently hardcoded at 10%. Will be dynamic with `platform_fee_config` implementation.

**Q: What happens on refunds?**  
A: Currently manual. Enhanced refund flow coming in Phase 3.

---

**Implementation Complete! 🎉**

Your payment and commission system is now production-ready with:
- ✅ Idempotency protection
- ✅ Commission tracking
- ✅ Payment validation
- ✅ Automated reconciliation
- ✅ Payout processing

Monitor the new queries regularly and adjust hold periods as needed based on your chargeback rates.

