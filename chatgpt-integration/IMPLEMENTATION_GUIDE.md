# CraftLocal ChatGPT Integration - Implementation Guide

## 🎯 Project Status

This document provides a comprehensive guide for implementing the ChatGPT integration for CraftLocal marketplace.

### What's Been Completed

✅ **Phase 1: Foundation (COMPLETE)**

- [x] Project structure created
- [x] Comprehensive documentation written:
  - Architecture overview
  - API inventory and gap analysis
  - Complete tool specifications (10 tools defined)
- [x] MCP server scaffolding with TypeScript
- [x] OAuth discovery endpoints implemented
- [x] Authentication middleware with JWT verification
- [x] Core tool implementations (search, listing detail, orders, checkout)
- [x] Basic widget generation
- [x] Health check endpoints
- [x] Logging and error handling

### What Needs to Be Done

## 📋 Remaining Implementation Tasks

### PHASE 2: OAuth Setup (2-3 weeks)

#### Option A: Using Supabase Auth (Recommended - Faster)

**Advantages**:

- Already integrated in your project
- No additional cost
- Simpler setup

**Steps**:

1. **Enable OAuth in Supabase**:

```sql
-- Already have user authentication, just need to expose OAuth endpoints
-- Supabase provides these automatically
```

2. **Configure OAuth Provider Settings**:

   - Go to Supabase Dashboard → Authentication → Providers
   - Enable OAuth 2.0 provider
   - Configure allowed redirect URLs for ChatGPT
   - Set up scopes mapping

3. **Test OAuth Flow**:

```bash
# Test discovery endpoint
curl https://your-project.supabase.co/auth/v1/.well-known/oauth-protected-resource

# Should return OAuth configuration
```

#### Option B: Using Auth0 (More Features, Costs Money)

**Advantages**:

- More customization options
- Better analytics
- Dedicated OAuth support

**Steps**:

1. **Create Auth0 Account**:

   - Sign up at auth0.com
   - Create new tenant

2. **Configure Application**:

   - Create new "Machine to Machine" application
   - Configure callback URLs
   - Set up custom scopes
   - Generate client credentials

3. **Configure MCP Server**:

```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-secret
USE_SUPABASE_AUTH=false
```

**Recommendation**: Start with Supabase Auth, migrate to Auth0 if needed later.

---

### PHASE 3: Enhanced API Endpoints (2-3 weeks)

#### 1. Implement Checkout Session Management

**Location**: `supabase/functions/create-checkout-session-mcp/index.ts`

```typescript
// New Supabase Edge Function for MCP checkout
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Create session in Redis/Database
  // 2. Store session ID, listing_id, quantity, user_id
  // 3. Set 30-minute expiration
  // 4. Return session object
});
```

**What to Build**:

- [ ] Create Redis/database table for checkout sessions
- [ ] Implement session creation endpoint
- [ ] Implement session update endpoint (for shipping address)
- [ ] Implement session completion endpoint
- [ ] Add session expiration handling

#### 2. Implement Tax Calculation

**Options**:

**Option A: TaxJar API (Recommended for production)**

```bash
npm install taxjar
```

**Option B: Simple Tax Rates (Development)**

```typescript
const TAX_RATES = {
  IL: 0.0625, // Illinois
  CA: 0.0725, // California
  // etc.
};
```

**What to Build**:

- [ ] Integrate tax calculation API
- [ ] Add tax calculation to checkout session update
- [ ] Store tax amount in session

#### 3. Implement Shipping Calculator

**What to Build**:

- [ ] Flat rate shipping per seller
- [ ] Distance-based shipping (optional)
- [ ] Free shipping threshold (optional)

```typescript
function calculateShipping(listing: Listing, shippingMethod: string) {
  if (shippingMethod === "pickup") return 0;
  if (shippingMethod === "standard") return listing.shipping_cost || 5.0;
  if (shippingMethod === "expedited") return (listing.shipping_cost || 5.0) * 2;
  return 0;
}
```

#### 4. Implement Stripe Agentic Commerce

**Sign Up for Preview**:

- Contact Stripe support to enable Agentic Commerce
- Request access to Shared Payment Tokens API

**What to Build**:

```typescript
// supabase/functions/complete-checkout-agentic/index.ts
serve(async (req) => {
  const { session_id, payment_token, shipping_address } = await req.json();

  // 1. Retrieve session
  // 2. Calculate final total (subtotal + tax + shipping)
  // 3. Process payment with Stripe using payment_token
  // 4. Create order in database
  // 5. Update inventory
  // 6. Send confirmation email
  // 7. Return order confirmation
});
```

**Steps**:

- [ ] Sign up for Stripe Agentic Commerce preview
- [ ] Implement shared payment token processing
- [ ] Test with Stripe test tokens
- [ ] Add error handling for payment failures

---

### PHASE 4: Production Widgets (3-4 weeks)

#### 1. Widget Development Environment

**Create New React Project**:

```bash
cd chatgpt-integration/widgets
npm create vite@latest . -- --template react-ts
npm install
```

**Install Dependencies**:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
npm install tailwindcss postcss autoprefixer
npm install react-hook-form zod
```

**Configure Build**:

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: {
        "product-grid": "./src/widgets/ProductGrid.tsx",
        "product-detail": "./src/widgets/ProductDetail.tsx",
        checkout: "./src/widgets/Checkout.tsx",
        "order-list": "./src/widgets/OrderList.tsx",
        "order-detail": "./src/widgets/OrderDetail.tsx",
        "listing-form": "./src/widgets/ListingForm.tsx",
        "seller-dashboard": "./src/widgets/SellerDashboard.tsx",
      },
      formats: ["iife"],
    },
  },
});
```

#### 2. Build 7 Core Widgets

**Priority Order**:

1. **Product Grid** (Week 1)

   - Grid/list view toggle
   - Pagination
   - Click to view details
   - Image loading optimization

2. **Product Detail** (Week 1)

   - Image gallery with zoom
   - Add to cart button
   - Seller information card
   - Reviews section

3. **Checkout** (Week 2)

   - Shipping form with validation
   - Shipping method selection
   - Order summary
   - Integration with Stripe payment element

4. **Order List** (Week 2)

   - Order cards with status badges
   - Filter by status
   - Click to view details

5. **Order Detail** (Week 3)

   - Complete order information
   - Tracking information
   - Contact seller button

6. **Listing Form** (Week 3)

   - Multi-step wizard
   - Image upload with preview
   - Category selection
   - Price and inventory management

7. **Seller Dashboard** (Week 4)
   - Sales metrics cards
   - Sales chart (Chart.js or Recharts)
   - Recent orders list
   - Quick actions

#### 3. Widget Integration with MCP Server

**Update MCP Server**:

```typescript
// src/routes/mcp.ts
router.get("/widgets/:widgetType", async (req, res) => {
  const { widgetType } = req.params;
  const data = req.query.data ? JSON.parse(req.query.data) : {};

  // Serve built widget HTML
  const widgetPath = path.join(
    __dirname,
    "../../widgets/dist",
    `${widgetType}.html`
  );

  if (fs.existsSync(widgetPath)) {
    let html = fs.readFileSync(widgetPath, "utf-8");
    // Inject data
    html = html.replace(
      "window.__WIDGET_DATA__ = {}",
      `window.__WIDGET_DATA__ = ${JSON.stringify(data)}`
    );
    res.send(html);
  } else {
    res.status(404).send("Widget not found");
  }
});
```

**Widget Data Injection**:

```typescript
// Each widget should read data from window object
declare global {
  interface Window {
    __WIDGET_DATA__: any;
    __MCP_API__: {
      invokeToolfunction(toolName: string, params: any): Promise<any>;
    };
  }
}

// In widget component
const data = window.__WIDGET_DATA__;
```

---

### PHASE 5: Testing & Deployment (2-3 weeks)

#### 1. Integration Testing

**Test Scenarios**:

- [ ] Guest browsing and search
- [ ] Authenticated user purchases
- [ ] Seller listing creation
- [ ] Order tracking
- [ ] Error handling for all edge cases

**Golden Prompt Testing**:

Create test file:

```typescript
// tests/golden-prompts.test.ts
const goldenPrompts = [
  // Direct prompts
  {
    prompt: "Show me handmade mugs under $30",
    expectedTool: "search_listings",
  },
  { prompt: "I want to buy this", expectedTool: "create_checkout" },
  { prompt: "Show my orders", expectedTool: "get_orders" },

  // Indirect prompts
  {
    prompt: "What gifts can I find for under $50?",
    expectedTool: "search_listings",
  },
  {
    prompt: "How much have I sold this month?",
    expectedTool: "get_seller_dashboard",
  },

  // Negative prompts
  { prompt: "What's the weather today?", expectedTool: null },
];

// Test each prompt
for (const test of goldenPrompts) {
  // Send to ChatGPT, verify correct tool invoked
}
```

#### 2. Performance Testing

**Load Test MCP Server**:

```bash
# Install k6
brew install k6  # or appropriate package manager

# Create load test
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const res = http.post('http://localhost:3001/mcp/execute', JSON.stringify({
    tool: 'search_listings',
    parameters: { query: 'ceramic' },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
EOF

# Run test
k6 run load-test.js
```

**Performance Targets**:

- [ ] MCP endpoint: < 500ms p95
- [ ] API calls: < 200ms p95
- [ ] Widget load: < 3s initial
- [ ] Checkout complete: < 5s total

#### 3. Security Audit

**Checklist**:

- [ ] All API endpoints require proper authentication
- [ ] Input validation on all tool parameters
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention in widgets
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting configured
- [ ] Secrets not exposed in logs
- [ ] HTTPS enforced in production

**Run Security Scan**:

```bash
npm install -g snyk
snyk test
```

#### 4. Production Deployment

**Deploy MCP Server**:

**Option 1: Fly.io** (Recommended):

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch --name craftlocal-mcp

# Set secrets
fly secrets set \
  SUPABASE_URL=$SUPABASE_URL \
  SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY

# Deploy
fly deploy
```

**Option 2: Render**:

1. Connect GitHub repo
2. Create Web Service
3. Set build command: `cd chatgpt-integration/mcp-server && npm install && npm run build`
4. Set start command: `cd chatgpt-integration/mcp-server && npm start`
5. Add environment variables
6. Deploy

**Deploy Widgets**:

Upload built widgets to CDN:

```bash
# Build widgets
cd chatgpt-integration/widgets
npm run build

# Upload to Cloudflare Pages or S3
# Update WIDGET_CDN_URL in MCP server config
```

#### 5. ChatGPT Integration

**Request Developer Mode**:

1. Apply for ChatGPT Developer Mode access
2. Wait for approval (can take several weeks)

**Create Connector**:

1. In ChatGPT settings, create new connector
2. Configure:

   - Name: "CraftLocal Marketplace"
   - Description: "Browse and purchase handmade artisan products"
   - Icon: Upload 512x512 logo
   - MCP Endpoint: `https://mcp.craftlocal.net`
   - Privacy Policy: Link to your privacy policy
   - Support Email: support@craftlocal.net

3. Test connector on:
   - ChatGPT web
   - ChatGPT iOS app
   - ChatGPT Android app

**Beta Testing**:

1. Recruit 10-20 beta testers
2. Provide connector access
3. Collect feedback
4. Iterate on improvements

#### 6. Monitor & Iterate

**Set Up Monitoring**:

**Sentry** (Error Tracking):

```bash
npm install @sentry/node
```

```typescript
// src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**DataDog** (APM):

```bash
npm install dd-trace
```

**Key Metrics to Track**:

- Tool invocation counts
- Tool selection accuracy
- Checkout conversion rate
- Error rates by tool
- Response times
- User satisfaction scores

---

## 🚀 Quick Start Guide

### For Development

1. **Set up MCP server**:

```bash
cd chatgpt-integration/mcp-server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

2. **Test endpoints**:

```bash
# Health check
curl http://localhost:3001/health

# OAuth discovery
curl http://localhost:3001/.well-known/oauth-protected-resource

# Search listings
curl -X POST http://localhost:3001/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_listings","parameters":{"query":"ceramic"}}'
```

3. **Test with mock ChatGPT requests**:

```bash
# Create test script
node tests/mock-chatgpt.js
```

### For Production

1. Deploy MCP server (see Phase 5)
2. Deploy widgets to CDN
3. Configure OAuth provider
4. Test all flows end-to-end
5. Apply for ChatGPT integration
6. Beta test
7. Launch!

---

## 📊 Timeline Summary

| Phase                         | Duration        | Status            |
| ----------------------------- | --------------- | ----------------- |
| Phase 1: Foundation           | 1 week          | ✅ COMPLETE       |
| Phase 2: OAuth Setup          | 2-3 weeks       | 🟡 READY TO START |
| Phase 3: API Enhancement      | 2-3 weeks       | 🟡 READY TO START |
| Phase 4: Widget Development   | 3-4 weeks       | 🟡 READY TO START |
| Phase 5: Testing & Deployment | 2-3 weeks       | ⚪ FUTURE         |
| **Total**                     | **10-14 weeks** | **~15% Complete** |

---

## 💰 Budget Estimate

**One-Time Costs**:

- Development time: $80-120K (depends on team)
- Security audit: $5-10K
- Design/UX: $5-10K

**Monthly Operating Costs**:

- MCP Server hosting (Fly.io): $20-50
- Widget CDN (Cloudflare): $0-20
- Redis: $0-50 (optional)
- OAuth (Auth0): $0-240 (if using Auth0)
- Monitoring (Sentry + DataDog): $0-200
- **Total: $20-560/month**

---

## 🎯 Next Immediate Steps

1. **Decision**: Choose OAuth provider (Supabase Auth vs Auth0)
2. **Set up**: Configure chosen OAuth provider
3. **Implement**: Checkout session management
4. **Test**: OAuth flow end-to-end
5. **Build**: Start on widgets

---

## 📚 Additional Resources

- [MCP Server README](./mcp-server/README.md)
- [Architecture Documentation](./docs/architecture.md)
- [Tool Specifications](./docs/tool-specifications.md)
- [API Inventory](./docs/api-inventory.md)
- [Original PRD](../chatgpt.md)

---

## ❓ Questions?

Contact the development team or refer to the documentation in `/chatgpt-integration/docs/`.
