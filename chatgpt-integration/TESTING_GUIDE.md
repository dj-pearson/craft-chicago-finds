# CraftLocal ChatGPT Integration - Testing Guide

## 🧪 Comprehensive Testing Strategy

This guide covers local testing, integration testing, and production validation.

---

## Local Development Testing

### 1. Widget Testing (Local)

#### Setup Local Dev Server

```bash
cd chatgpt-integration/widgets
npm install
npm run dev
```

Opens at `http://localhost:3002`

#### Test Each Widget

**Product Grid Widget:**

```html
<!-- Create: test-product-grid.html -->
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="http://localhost:3002/src/index.js"></script>
</head>
<body>
  <craftlocal-product-grid 
    listings='[
      {
        "id": "test-1",
        "title": "Handmade Necklace",
        "price": 89.99,
        "images": ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400"],
        "tags": ["jewelry", "handmade"]
      },
      {
        "id": "test-2",
        "title": "Leather Bracelet",
        "price": 45.00,
        "images": ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400"],
        "tags": ["leather", "jewelry"]
      }
    ]'
    columns="2">
  </craftlocal-product-grid>

  <script>
    const grid = document.querySelector('craftlocal-product-grid');
    
    grid.addEventListener('product-click', (e) => {
      console.log('Product clicked:', e.detail.listingId);
      alert(`Clicked product: ${e.detail.listingId}`);
    });
  </script>
</body>
</html>
```

**Product Detail Widget:**

```html
<!-- Create: test-product-detail.html -->
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="http://localhost:3002/src/index.js"></script>
</head>
<body>
  <craftlocal-product-detail listing-id="real-listing-id-here">
  </craftlocal-product-detail>

  <script>
    const detail = document.querySelector('craftlocal-product-detail');
    
    // Set access token for authenticated requests
    detail.setAccessToken('your_test_access_token');
    
    detail.addEventListener('add-to-cart', (e) => {
      console.log('Add to cart:', e.detail.listing);
      alert('Added to cart!');
    });
    
    detail.addEventListener('contact-seller', (e) => {
      console.log('Contact seller:', e.detail.sellerId);
      alert('Opening seller contact...');
    });
  </script>
</body>
</html>
```

**Checkout Widget:**

```html
<!-- Create: test-checkout.html -->
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="http://localhost:3002/src/index.js"></script>
</head>
<body>
  <craftlocal-checkout session-id="test_session_123">
  </craftlocal-checkout>

  <script>
    const checkout = document.querySelector('craftlocal-checkout');
    
    checkout.addEventListener('checkout-initiated', (e) => {
      console.log('Checkout initiated:', e.detail);
      alert('Redirecting to Stripe...');
    });
  </script>
</body>
</html>
```

#### Widget Test Checklist

- [ ] Widgets render without errors
- [ ] Styles are properly scoped (no leaks)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Images load and lazy-load correctly
- [ ] Click events fire properly
- [ ] Custom events emit expected data
- [ ] Loading states display correctly
- [ ] Error states show helpful messages
- [ ] Empty states render appropriately
- [ ] Shadow DOM encapsulation works
- [ ] No console errors
- [ ] Accessible (keyboard nav, ARIA labels)

---

### 2. MCP Server Testing (Local)

#### Start Local Server

```bash
cd chatgpt-integration/mcp-server
npm install
npm run dev
```

Runs at `http://localhost:8080`

#### Test Health Endpoint

```bash
curl http://localhost:8080/health
# Expected: {"status":"ok","timestamp":"2025-01-XX..."}
```

#### Test Tool Discovery

```bash
curl http://localhost:8080/tools
# Expected: JSON array of available tools
```

#### Test Individual Tools

**Search Listings:**

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "tool": "search_listings",
    "parameters": {
      "query": "jewelry",
      "city": "chicago",
      "limit": 5
    }
  }'
```

**Get Listing Details:**

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_listing",
    "parameters": {
      "listing_id": "actual-uuid-from-your-db"
    }
  }'
```

**Calculate Shipping:**

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "calculate_shipping",
    "parameters": {
      "items": [
        {"listing_id": "uuid-here", "quantity": 2}
      ],
      "destination": {
        "city": "Chicago",
        "state": "IL",
        "zip": "60614",
        "country": "US"
      }
    }
  }'
```

**Create Checkout (requires auth):**

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "tool": "create_checkout",
    "parameters": {
      "items": [
        {"listing_id": "uuid-here", "quantity": 1}
      ],
      "shipping_address": {
        "street": "123 Main St",
        "city": "Chicago",
        "state": "IL",
        "zip": "60614",
        "country": "US"
      },
      "apply_tax": true
    }
  }'
```

**Seller Dashboard (requires seller auth):**

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "tool": "get_seller_dashboard",
    "parameters": {
      "time_period": "30d"
    }
  }'
```

**Create Listing (requires seller auth):**

```bash
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -d '{
    "tool": "create_listing",
    "parameters": {
      "title": "Test Product",
      "description": "A test product for ChatGPT integration",
      "price": 49.99,
      "category": "jewelry",
      "city": "chicago",
      "inventory_count": 5,
      "images": ["https://example.com/image.jpg"],
      "tags": ["test", "handmade"],
      "local_pickup_available": true,
      "shipping_available": true
    }
  }'
```

#### MCP Server Test Checklist

- [ ] Health endpoint responds
- [ ] Tool discovery returns all tools
- [ ] Public tools work without auth
- [ ] Protected tools require valid token
- [ ] Invalid tokens return 401
- [ ] Missing parameters return 400
- [ ] Valid requests return expected data
- [ ] Widget HTML is included in responses
- [ ] CORS headers are present
- [ ] Error messages are helpful
- [ ] Logs show request/response details

---

### 3. Supabase Edge Function Testing

#### Test Checkout Function

```bash
# Get your Supabase anon key
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get a user access token (from your app's auth flow)
USER_TOKEN="your_user_access_token"

curl -X POST https://api.craftlocal.net/functions/v1/chatgpt-create-checkout \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"listing_id": "uuid-here", "quantity": 1}
    ],
    "shipping_address": {
      "street": "123 Main St",
      "city": "Chicago",
      "state": "IL",
      "zip": "60614",
      "country": "US"
    },
    "apply_tax": true
  }'
```

Expected response:

```json
{
  "session_id": "cs_test_...",
  "checkout_url": "https://checkout.stripe.com/c/pay/...",
  "breakdown": {
    "subtotal": 89.99,
    "tax": 5.62,
    "shipping": 5.99,
    "total": 101.60
  }
}
```

#### Edge Function Test Checklist

- [ ] Function responds within 5 seconds
- [ ] Valid user tokens are accepted
- [ ] Invalid tokens return 401
- [ ] Missing items return 400
- [ ] Tax calculation is correct for IL (6.25%)
- [ ] Shipping calculation uses correct formula
- [ ] Stripe session is created successfully
- [ ] Checkout URL is valid
- [ ] Metadata includes user_id and order_type
- [ ] Errors are logged properly

---

## Integration Testing

### Test OAuth Flow

#### 1. Manual OAuth Test

```bash
# Step 1: Get authorization URL
echo "https://api.craftlocal.net/auth/v1/authorize?client_id=chatgpt-integration&redirect_uri=http://localhost:8080/oauth/callback&response_type=code&scope=listings.read+listings.write+orders.read+orders.write"

# Step 2: Open in browser, login, get code from URL
# Step 3: Exchange code for token
curl -X POST http://localhost:8080/oauth/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=YOUR_AUTH_CODE&redirect_uri=http://localhost:8080/oauth/callback"
```

Expected response:

```json
{
  "access_token": "eyJh...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "scope": "listings.read listings.write orders.read orders.write"
}
```

#### 2. Test Token Scopes

```bash
# Test with token
TOKEN="access_token_here"

# Should work (has listings.read scope)
curl -X POST http://localhost:8080/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_listings","parameters":{"query":"test"}}'

# Should fail if not a seller (needs listings.write scope)
curl -X POST http://localhost:8080/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool":"create_listing","parameters":{"title":"Test"}}'
```

### Test End-to-End Flow

#### Browse → View → Checkout Flow

```bash
# 1. Search for products
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "search_listings",
    "parameters": {"query": "jewelry", "city": "chicago"}
  }' | jq '.results[0].id'

# 2. Get details for first product (save listing_id from above)
LISTING_ID="uuid-from-step-1"

curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"get_listing\",
    \"parameters\": {\"listing_id\": \"$LISTING_ID\"}
  }"

# 3. Calculate shipping
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"calculate_shipping\",
    \"parameters\": {
      \"items\": [{\"listing_id\": \"$LISTING_ID\", \"quantity\": 1}],
      \"destination\": {
        \"city\": \"Chicago\",
        \"state\": \"IL\",
        \"zip\": \"60614\",
        \"country\": \"US\"
      }
    }
  }"

# 4. Create checkout (requires auth)
curl -X POST http://localhost:8080/execute \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"create_checkout\",
    \"parameters\": {
      \"items\": [{\"listing_id\": \"$LISTING_ID\", \"quantity\": 1}],
      \"shipping_address\": {
        \"street\": \"123 Main St\",
        \"city\": \"Chicago\",
        \"state\": \"IL\",
        \"zip\": \"60614\",
        \"country\": \"US\"
      },
      \"apply_tax\": true
    }
  }"
```

---

## ChatGPT Testing (Pre-Production)

### Test Conversations

Once MCP server is deployed, test these conversations:

#### 1. Search & Browse

**User:** "Show me handmade jewelry in Chicago"

**Expected:**
- ChatGPT calls `search_listings` tool
- Returns 5-10 results
- Renders `<craftlocal-product-grid>` widget
- Widget displays products in responsive grid

**User:** "Show me more details about [product name]"

**Expected:**
- ChatGPT calls `get_listing` tool
- Returns full product details
- Renders `<craftlocal-product-detail>` widget
- Widget shows images, price, description, seller info

#### 2. Shipping & Checkout

**User:** "How much would shipping be to 60614 for this necklace?"

**Expected:**
- ChatGPT calls `calculate_shipping` tool
- Returns shipping cost breakdown
- Shows delivery estimate
- Provides clear pricing information

**User:** "I want to buy this. My address is 123 Main St, Chicago IL 60614"

**Expected:**
- ChatGPT prompts for OAuth if not authenticated
- User authorizes access
- ChatGPT calls `create_checkout` tool
- Returns Stripe checkout session
- Renders `<craftlocal-checkout>` widget
- Widget has clickable checkout link

#### 3. Seller Management

**User:** "Show me my seller dashboard"

**Expected:**
- ChatGPT verifies authentication
- Calls `get_seller_dashboard` tool
- Returns metrics (sales, orders, etc.)
- Displays dashboard widget

**User:** "Create a new listing for a handmade bracelet, price $45"

**Expected:**
- ChatGPT gathers all required info
- Calls `create_listing` tool
- Returns confirmation
- Shows listing ID and status

---

## Performance Testing

### Load Testing MCP Server

Use Apache Bench or similar:

```bash
# Test tool discovery endpoint
ab -n 1000 -c 10 http://localhost:8080/tools

# Test search endpoint
ab -n 100 -c 5 -p search-payload.json -T application/json http://localhost:8080/execute
```

**Performance Targets:**
- Tool discovery: < 50ms
- Search listings: < 500ms
- Get listing: < 200ms
- Calculate shipping: < 100ms
- Create checkout: < 2000ms (due to Stripe API)

### Widget Load Testing

Use Lighthouse or WebPageTest:

```bash
# Install Lighthouse
npm install -g lighthouse

# Test widget page
lighthouse http://localhost:3002 --view
```

**Widget Targets:**
- First Contentful Paint: < 1.0s
- Time to Interactive: < 2.0s
- Total Bundle Size: < 50KB (gzipped)
- Lighthouse Score: > 90

---

## Security Testing

### 1. Test Authentication

```bash
# Should fail without token
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"create_listing","parameters":{"title":"Test"}}'

# Should fail with invalid token
curl -X POST http://localhost:8080/execute \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"tool":"create_listing","parameters":{"title":"Test"}}'

# Should fail with expired token
curl -X POST http://localhost:8080/execute \
  -H "Authorization: Bearer expired_token" \
  -H "Content-Type: application/json" \
  -d '{"tool":"get_seller_dashboard","parameters":{}}'
```

### 2. Test Authorization (Scopes)

```bash
# User with only listings.read should NOT be able to create
curl -X POST http://localhost:8080/execute \
  -H "Authorization: Bearer $READ_ONLY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tool":"create_listing","parameters":{"title":"Test"}}'

# Expected: 403 Forbidden
```

### 3. Test Input Validation

```bash
# Missing required fields
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_listings","parameters":{}}'

# Invalid data types
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"calculate_shipping","parameters":{"items":"not an array"}}'

# SQL injection attempt
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_listings","parameters":{"query":"test OR 1=1--"}}'

# XSS attempt
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_listings","parameters":{"query":"<script>alert(1)</script>"}}'
```

All should return appropriate errors without executing malicious code.

---

## Regression Testing

### Create Test Suite

```javascript
// test-suite.js
const tests = [
  {
    name: 'Search listings without auth',
    tool: 'search_listings',
    parameters: { query: 'test', limit: 5 },
    requiresAuth: false,
    expectedStatus: 200
  },
  {
    name: 'Get listing details',
    tool: 'get_listing',
    parameters: { listing_id: 'test-uuid' },
    requiresAuth: false,
    expectedStatus: 200
  },
  {
    name: 'Calculate shipping',
    tool: 'calculate_shipping',
    parameters: {
      items: [{ listing_id: 'test-uuid', quantity: 1 }],
      destination: { city: 'Chicago', state: 'IL', zip: '60614', country: 'US' }
    },
    requiresAuth: false,
    expectedStatus: 200
  },
  {
    name: 'Create checkout with auth',
    tool: 'create_checkout',
    parameters: {
      items: [{ listing_id: 'test-uuid', quantity: 1 }],
      shipping_address: {
        street: '123 Main St',
        city: 'Chicago',
        state: 'IL',
        zip: '60614',
        country: 'US'
      },
      apply_tax: true
    },
    requiresAuth: true,
    expectedStatus: 200
  }
];

// Run tests
async function runTests() {
  for (const test of tests) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (test.requiresAuth) {
      headers['Authorization'] = `Bearer ${process.env.TEST_TOKEN}`;
    }
    
    const response = await fetch('http://localhost:8080/execute', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: test.tool,
        parameters: test.parameters
      })
    });
    
    const passed = response.status === test.expectedStatus;
    console.log(`${passed ? '✅' : '❌'} ${test.name}`);
  }
}

runTests();
```

---

## Production Smoke Tests

After deployment, verify:

- [ ] MCP server health endpoint responds
- [ ] Widget CDN URL loads
- [ ] OAuth flow completes successfully
- [ ] Search tool returns results
- [ ] Widgets render in ChatGPT
- [ ] Checkout creates Stripe session
- [ ] Error handling works (try invalid requests)
- [ ] Monitoring/logging is working

---

## Testing Checklist Summary

### Pre-Deployment
- [ ] All widgets tested locally
- [ ] MCP server tools tested
- [ ] Edge functions tested
- [ ] OAuth flow validated
- [ ] Performance targets met
- [ ] Security tests passed
- [ ] Browser compatibility verified
- [ ] Mobile responsive checked

### Post-Deployment
- [ ] Production URLs accessible
- [ ] ChatGPT integration working
- [ ] Real checkout flow completes
- [ ] Monitoring alerts configured
- [ ] Error tracking enabled
- [ ] Logs accessible
- [ ] Rollback plan tested

---

**Next:** See `DEPLOYMENT_GUIDE.md` for production deployment instructions.
