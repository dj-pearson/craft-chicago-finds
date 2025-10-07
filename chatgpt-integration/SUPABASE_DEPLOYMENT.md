# ChatGPT Integration - Supabase Deployment

## ✅ Simplified Architecture

Everything now runs on Supabase - no external hosting needed!

### 1. **Widgets → Supabase Storage**

CDN URL: `https://slamtlgebisrimijeoid.supabase.co/storage/v1/object/public/chatgpt-widgets/craftlocal-widgets.js`

### 2. **MCP Server → Supabase Edge Functions**

| Tool | Edge Function | Auth Required |
|------|--------------|---------------|
| Search listings | `chatgpt-search-listings` | ❌ No |
| Get listing details | `chatgpt-get-listing` | ❌ No |
| Calculate shipping | `chatgpt-create-checkout` | ✅ Yes |
| Seller dashboard | `chatgpt-seller-dashboard` | ✅ Yes |
| Create listing | `chatgpt-create-listing` | ✅ Yes |
| Update listing | `chatgpt-update-listing` | ✅ Yes |
| Delete listing | `chatgpt-delete-listing` | ✅ Yes |

---

## Deployment Steps

### Step 1: Build & Upload Widgets

```bash
cd chatgpt-integration/widgets
npm install
npm run build
```

Upload `dist/craftlocal-widgets.js` to Supabase Storage:

**Via Supabase Dashboard:**
1. Go to Storage → `chatgpt-widgets` bucket
2. Upload `craftlocal-widgets.js`

**Via CLI (if you have supabase CLI):**
```bash
supabase storage cp dist/craftlocal-widgets.js chatgpt-widgets/craftlocal-widgets.js
```

### Step 2: Test Edge Functions

All edge functions are automatically deployed with your Supabase project.

**Test Search (no auth):**
```bash
curl -X POST https://slamtlgebisrimijeoid.supabase.co/functions/v1/chatgpt-search-listings \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"query": "jewelry", "city": "chicago", "limit": 5}'
```

**Test Get Listing (no auth):**
```bash
curl -X POST https://slamtlgebisrimijeoid.supabase.co/functions/v1/chatgpt-get-listing \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"listing_id": "YOUR_LISTING_ID"}'
```

**Test Seller Dashboard (requires auth):**
```bash
curl -X POST https://slamtlgebisrimijeoid.supabase.co/functions/v1/chatgpt-seller-dashboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"time_period": "30d"}'
```

**Test Create Listing (requires auth):**
```bash
curl -X POST https://slamtlgebisrimijeoid.supabase.co/functions/v1/chatgpt-create-listing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "title": "Handmade Bracelet",
    "description": "Beautiful handcrafted leather bracelet",
    "price": 45.00,
    "category": "jewelry",
    "city": "chicago",
    "inventory_count": 5,
    "tags": ["handmade", "leather", "jewelry"],
    "local_pickup_available": true,
    "shipping_available": true
  }'
```

### Step 3: Configure ChatGPT

Register your integration with ChatGPT:

**Base URL:** `https://slamtlgebisrimijeoid.supabase.co/functions/v1`

**Available Functions:**
- `/chatgpt-search-listings` - Search products
- `/chatgpt-get-listing` - Get product details
- `/chatgpt-seller-dashboard` - View seller metrics
- `/chatgpt-create-listing` - Create new listing
- `/chatgpt-update-listing` - Update listing
- `/chatgpt-delete-listing` - Delete listing
- `/chatgpt-create-checkout` - Create Stripe checkout

**Authentication:**
- Public functions use Supabase `apikey` header (anon key)
- Protected functions require `Authorization: Bearer <user_token>` header

**OAuth Flow:**
```json
{
  "authorization_url": "https://slamtlgebisrimijeoid.supabase.co/auth/v1/authorize",
  "token_url": "https://slamtlgebisrimijeoid.supabase.co/auth/v1/token",
  "client_id": "your_client_id",
  "scope": "openid email profile"
}
```

---

## Edge Function Endpoints

### Public (No Auth Required)

**Search Listings:**
```
POST /functions/v1/chatgpt-search-listings
Body: {
  "query": "jewelry",
  "category": "jewelry",
  "city": "chicago",
  "min_price": 0,
  "max_price": 100,
  "limit": 20,
  "offset": 0
}
```

**Get Listing:**
```
POST /functions/v1/chatgpt-get-listing
Body: {
  "listing_id": "uuid"
}
```

### Protected (Auth Required)

**Seller Dashboard:**
```
POST /functions/v1/chatgpt-seller-dashboard
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "time_period": "30d"
}
```

**Create Listing:**
```
POST /functions/v1/chatgpt-create-listing
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "title": "Product Name",
  "description": "Description",
  "price": 49.99,
  "category": "jewelry",
  "city": "chicago",
  "inventory_count": 5,
  "images": ["url1", "url2"],
  "tags": ["tag1", "tag2"],
  "local_pickup_available": true,
  "shipping_available": true
}
```

**Update Listing:**
```
POST /functions/v1/chatgpt-update-listing
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "listing_id": "uuid",
  "price": 59.99,
  "inventory_count": 10
}
```

**Delete Listing:**
```
POST /functions/v1/chatgpt-delete-listing
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "listing_id": "uuid"
}
```

---

## Widget Integration

All functions return a `widget` field with embeddable HTML:

```json
{
  "results": [...],
  "widget": "<script src='https://slamtlgebisrimijeoid.supabase.co/storage/v1/object/public/chatgpt-widgets/craftlocal-widgets.js'></script><craftlocal-product-grid listings='[...]'></craftlocal-product-grid>"
}
```

ChatGPT will render this HTML inline during conversations.

---

## Benefits of Supabase Architecture

✅ **No External Hosting** - Everything on Supabase
✅ **Auto-Deploy** - Functions deploy with your code
✅ **Built-in Auth** - Supabase Auth integration
✅ **Direct DB Access** - No API layer needed
✅ **Free Tier** - Generous limits for development
✅ **Global CDN** - Fast widget delivery
✅ **Unified Logs** - All logs in one place
✅ **RLS Security** - Database-level access control

---

## Monitoring

**Edge Function Logs:**
```
Supabase Dashboard → Edge Functions → Select function → Logs
```

**Storage Access:**
```
Supabase Dashboard → Storage → chatgpt-widgets → View logs
```

**Database Activity:**
```
Supabase Dashboard → Database → Query Editor
SELECT * FROM listings WHERE created_at > now() - interval '1 hour';
```

---

## Cost Estimation

**Supabase Free Tier:**
- 500MB database
- 1GB file storage
- 2 million edge function invocations/month
- 50GB bandwidth

**Sufficient for:**
- ~1,000 listings
- ~10,000 monthly ChatGPT interactions
- Unlimited widget loads (CDN cached)

**Pro Plan ($25/mo):**
- 8GB database
- 100GB file storage
- Unlimited edge function invocations
- 250GB bandwidth

---

## Security

**RLS Policies Applied:**
- ✅ Listings table - Public read, seller write
- ✅ Orders table - User/seller access only
- ✅ Profiles table - User owns profile
- ✅ Storage bucket - Public read, admin write

**Edge Function Auth:**
- Public functions: No JWT validation
- Protected functions: JWT validation enabled
- All functions: Rate limiting via Supabase

---

## Next Steps

1. ✅ Build and upload widgets
2. ✅ Test all edge functions
3. ✅ Configure ChatGPT integration
4. ✅ Monitor initial usage
5. Optional: Add caching layer
6. Optional: Implement webhooks for real-time updates

---

**Your ChatGPT integration is now 100% Supabase-powered! 🎉**
