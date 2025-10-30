# Payment System Optimization Report
## Craft Chicago Finds - Complete Checkout & Commission Analysis

**Date:** October 30, 2025  
**Status:** Comprehensive Review Complete  
**Priority:** CRITICAL - Production Impact

---

## Executive Summary

Your payment system has a solid foundation with Stripe integration and Supabase, but there are **7 critical vulnerabilities** that could lead to:
- 💰 **Lost revenue** from duplicate orders or failed commission captures
- 🔒 **Security issues** from missing validation
- 📊 **Accounting problems** from inadequate commission tracking
- ⚠️ **Customer experience issues** from payment failures

**Current Platform Fee:** 10% (hardcoded across multiple files)

---

## Current Architecture

### Payment Flow

```
1. Customer Checkout
   ├── Frontend: StripeCheckout.tsx (10% fee calculation)
   ├── Backend: create-payment-intent OR create-checkout-session
   └── Webhook: stripe-webhook/index.ts (order creation)

2. Stripe Connect (if seller configured)
   ├── Seller onboarding via create-connect-account
   ├── Application fee: 10% to platform
   └── Transfer: 90% to seller automatically

3. Fallback (no Stripe Connect)
   ├── Full payment to platform account
   └── Manual payout required (not automated)
```

### Commission Models Currently Supported

1. **Stripe Connect (Recommended)** ✅
   - Automatic split: 10% platform, 90% to seller
   - Immediate seller payout (or standard Stripe schedule)
   - Platform fee captured automatically

2. **Direct Payments (Problematic)** ⚠️
   - 100% to platform account
   - Commission tracked in `orders.commission_amount`
   - **NO automated payout system**
   - Requires manual processing

---

## Critical Issues Identified

### 🔴 ISSUE #1: Webhook Idempotency Missing
**Risk:** HIGH - Duplicate orders on webhook retry  
**Location:** `supabase/functions/stripe-webhook/index.ts`

```typescript
// CURRENT CODE (Lines 99-120)
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // ❌ NO CHECK FOR EXISTING ORDER
  if (metadata.is_cart_checkout === "true") {
    await handleCartCheckout(session, metadata);
  } else {
    await handleSingleItemCheckout(session, metadata);
  }
}
```

**Impact:**
- Stripe retries webhooks up to 3 days
- Could create duplicate orders
- Double charges customers
- Inventory depletes incorrectly

**Solution:**
```typescript
// Add idempotency check
const { data: existingOrder } = await supabaseClient
  .from('orders')
  .select('id')
  .eq('stripe_session_id', session.id)
  .single();

if (existingOrder) {
  console.log('Order already processed:', existingOrder.id);
  return; // Skip duplicate
}
```

---

### 🔴 ISSUE #2: Commission Payout Tracking
**Risk:** HIGH - No way to track paid vs unpaid commissions  
**Location:** Database schema

**Current State:**
- `orders.commission_amount` stores the amount
- NO status tracking (pending/paid/failed)
- NO payout date tracking
- NO reconciliation capability

**Missing Fields:**
```sql
-- Need to add to orders table:
commission_status TEXT CHECK (commission_status IN 
  ('pending', 'held', 'paid', 'failed', 'disputed')),
commission_paid_at TIMESTAMPTZ,
commission_payout_id TEXT,
commission_payout_method TEXT,
platform_revenue DECIMAL(10,2)
```

---

### 🔴 ISSUE #3: No Transaction Rollback
**Risk:** HIGH - Partial order creation on failure  
**Location:** `supabase/functions/stripe-webhook/index.ts` Lines 170-249

```typescript
// CURRENT: Cart checkout creates orders in loop
for (const [sellerId, items] of Object.entries(ordersBySeller)) {
  const { data: orderData } = await supabaseClient.from("orders").insert({...});
  // ❌ If seller 2 fails, seller 1 order still exists
  // ❌ Customer charged but incomplete order
}
```

**Impact:**
- Multi-seller cart: if one order fails, others succeed
- Inventory already decremented
- Payment already captured
- Customer gets partial order

**Solution:** Use Supabase transactions or implement compensating transactions

---

### 🟡 ISSUE #4: Platform Fee Calculation Inconsistency
**Risk:** MEDIUM - Fee calculated in multiple places  
**Locations:** 
- `src/components/checkout/StripeCheckout.tsx:66` → `PLATFORM_FEE_RATE = 0.1`
- `supabase/functions/create-payment-intent/index.ts:106` → `PLATFORM_FEE_RATE = 0.1`
- `supabase/functions/create-checkout-session/index.ts:69` → `PLATFORM_FEE_RATE = 0.1`
- `supabase/functions/stripe-webhook/index.ts:194` → `sellerCommission = sellerTotal * 0.1`

**Problem:**
- Fee rate hardcoded in 15+ locations
- Changing fee requires code updates
- No per-seller custom fees
- No promotional fee discounts

**Solution:** Store in database configuration

---

### 🟡 ISSUE #5: No Stripe Connect Validation
**Risk:** MEDIUM - Orders created without valid payout method  
**Location:** Multiple edge functions

**Current Flow:**
```typescript
if (sellerProfile?.stripe_account_id) {
  // Use Connect
  paymentIntentData.application_fee_amount = platformFee;
} 
// ❌ ELSE: No handling for missing account
// ❌ Full payment goes to platform
// ❌ No alert to seller
```

**Missing Checks:**
- Is Connect account verified?
- Can account receive payouts?
- Are there any restrictions?

---

### 🟡 ISSUE #6: Payment Validation Insufficient
**Risk:** MEDIUM - Invalid payments create orders  
**Location:** Multiple edge functions

**Missing Validations:**
- Amount match (frontend vs backend)
- Inventory availability before payment
- Seller account status
- Buyer account standing
- Fraud detection integration incomplete

---

### 🟡 ISSUE #7: No Commission Reconciliation
**Risk:** MEDIUM - Can't audit platform revenue  
**Location:** Missing entirely

**Needs:**
- Daily/monthly commission reports
- Platform revenue dashboard
- Seller payout statements
- Tax reporting exports
- Dispute tracking with commission impact

---

## Recommended Architecture

### Phase 1: Critical Fixes (Do First)

```
1. Webhook Idempotency
   └── Add stripe_session_id to orders table
   └── Check before creating orders
   └── Add unique constraint

2. Commission Tracking Schema
   └── Add commission status fields
   └── Create commission_payouts table
   └── Track all platform revenue

3. Transaction Safety
   └── Wrap multi-order creation in transaction
   └── Implement rollback on any failure
   └── Queue for retry on network errors
```

### Phase 2: Enhanced System

```
1. Centralized Fee Configuration
   CREATE TABLE platform_fees (
     id UUID PRIMARY KEY,
     fee_type TEXT, -- 'standard', 'promotional', 'per_seller'
     rate DECIMAL(5,4), -- 0.1000 for 10%
     seller_id UUID, -- null for default
     valid_from TIMESTAMPTZ,
     valid_until TIMESTAMPTZ
   );

2. Stripe Connect Health Check
   └── Verify account before order
   └── Cache verification status
   └── Alert seller of issues

3. Automated Payout System
   └── For non-Connect sellers
   └── Scheduled payout runs
   └── Bank account management
```

### Phase 3: Advanced Features

```
1. Commission Reconciliation
   └── Real-time revenue dashboard
   └── Automated statements
   └── Tax reporting

2. Dynamic Pricing
   └── Volume discounts
   └── Category-based fees
   └── Seasonal promotions

3. Refund Handling
   └── Commission reversal logic
   └── Partial refund support
   └── Dispute management
```

---

## Database Schema Additions

### 1. Orders Table Enhancements

```sql
-- Add to existing orders table
ALTER TABLE orders
ADD COLUMN stripe_session_id TEXT UNIQUE,
ADD COLUMN stripe_checkout_id TEXT,
ADD COLUMN commission_status TEXT DEFAULT 'pending'
  CHECK (commission_status IN ('pending', 'held', 'paid', 'failed', 'disputed', 'refunded')),
ADD COLUMN commission_paid_at TIMESTAMPTZ,
ADD COLUMN commission_payout_id TEXT,
ADD COLUMN commission_hold_until TIMESTAMPTZ,
ADD COLUMN platform_fee_rate DECIMAL(5,4) DEFAULT 0.1000,
ADD COLUMN actual_platform_revenue DECIMAL(10,2);

-- Add index for idempotency checks
CREATE UNIQUE INDEX idx_orders_stripe_session_id 
ON orders(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

-- Add index for commission tracking
CREATE INDEX idx_orders_commission_status 
ON orders(commission_status, created_at);
```

### 2. Commission Payouts Table (NEW)

```sql
CREATE TABLE commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Payout details
  payout_method TEXT NOT NULL CHECK (payout_method IN 
    ('stripe_connect', 'stripe_transfer', 'bank_transfer', 'manual')),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN 
    ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Amounts
  gross_sales DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  seller_payout DECIMAL(10,2) NOT NULL,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- External references
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  
  -- Metadata
  order_count INTEGER NOT NULL DEFAULT 0,
  order_ids UUID[] DEFAULT '{}',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID,
  processor_name TEXT
);

CREATE INDEX idx_commission_payouts_seller ON commission_payouts(seller_id, period_end DESC);
CREATE INDEX idx_commission_payouts_status ON commission_payouts(payout_status);
```

### 3. Platform Revenue Table (NEW)

```sql
CREATE TABLE platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Revenue period
  period_date DATE NOT NULL UNIQUE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  
  -- Revenue breakdown
  gross_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_commissions DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
  refunds_issued DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Order counts
  order_count INTEGER NOT NULL DEFAULT 0,
  seller_count INTEGER NOT NULL DEFAULT 0,
  buyer_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT now(),
  recalculated_at TIMESTAMPTZ
);

CREATE INDEX idx_platform_revenue_date ON platform_revenue(period_date DESC);
```

### 4. Platform Fee Configuration (NEW)

```sql
CREATE TABLE platform_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fee details
  fee_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN 
    ('standard', 'promotional', 'volume_discount', 'category_based', 'seller_specific')),
  fee_rate DECIMAL(5,4) NOT NULL CHECK (fee_rate >= 0 AND fee_rate <= 1),
  
  -- Applicability
  seller_id UUID REFERENCES auth.users(id), -- null = all sellers
  category_id UUID REFERENCES categories(id),
  min_order_value DECIMAL(10,2),
  max_order_value DECIMAL(10,2),
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Priority (higher = used first)
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_platform_fee_active ON platform_fee_config(is_active, priority DESC);
CREATE INDEX idx_platform_fee_seller ON platform_fee_config(seller_id) WHERE seller_id IS NOT NULL;
```

---

## Implementation Priority

### ⚡ IMMEDIATE (This Week)
1. **Webhook Idempotency** - 4 hours
2. **Commission Status Tracking** - 3 hours  
3. **Transaction Rollback** - 6 hours
4. **Amount Validation** - 3 hours

**Total: ~16 hours / 2 days**

### 📋 NEAR-TERM (Next 2 Weeks)
5. **Stripe Connect Validation** - 4 hours
6. **Centralized Fee Config** - 6 hours
7. **Commission Payouts System** - 8 hours
8. **Revenue Dashboard** - 8 hours

**Total: ~26 hours / 3-4 days**

### 🎯 FUTURE (Month 2+)
9. **Automated Payout Processing** - 16 hours
10. **Advanced Reconciliation** - 12 hours
11. **Tax Reporting** - 8 hours
12. **Refund Flow Enhancement** - 8 hours

---

## Next Steps

1. ✅ **Review this document** with your team
2. ⏭️ **Approve implementation plan**
3. 🔨 **Begin Phase 1 critical fixes**
4. 🧪 **Test thoroughly in staging**
5. 🚀 **Deploy with monitoring**

---

## Questions to Consider

1. **Fee Structure**: Will 10% remain constant, or do you need dynamic fees?
2. **Payout Schedule**: How often should sellers receive payouts?
3. **Minimum Payout**: What's the minimum amount for a payout?
4. **Reserve Period**: Should you hold commissions for X days (chargeback protection)?
5. **Refund Policy**: How should commission reversal work on refunds?
6. **Tax Handling**: Do you need to collect platform fees separately for tax?

---

**Ready to implement these improvements?** I can start with the critical fixes immediately.

