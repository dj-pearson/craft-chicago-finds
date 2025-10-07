# CraftLocal ChatGPT Integration - System Architecture

## Overview

This document outlines the technical architecture for integrating CraftLocal.net marketplace with ChatGPT using the Model Context Protocol (MCP).

## High-Level Architecture

```
┌─────────────────┐
│   ChatGPT App   │
│  (800M+ Users)  │
└────────┬────────┘
         │
         │ MCP Protocol (HTTP/SSE)
         │
┌────────▼─────────────────────┐
│    MCP Server (Node.js)      │
│  - Tool Registration         │
│  - Request Routing           │
│  - Widget Management         │
│  - OAuth Token Validation    │
└────────┬─────────────────────┘
         │
         ├──────────┬────────────┬──────────────┐
         │          │            │              │
    ┌────▼────┐ ┌──▼───┐ ┌──────▼──────┐ ┌────▼────┐
    │  OAuth  │ │ API  │ │   Stripe    │ │ Widgets │
    │Provider │ │Layer │ │   Agentic   │ │(React)  │
    └────┬────┘ └──┬───┘ └──────┬──────┘ └────┬────┘
         │         │             │              │
         └─────────┴─────────────┴──────────────┘
                           │
                    ┌──────▼───────┐
                    │   Supabase   │
                    │  - Database  │
                    │  - Auth      │
                    │  - Functions │
                    └──────────────┘
```

## Component Details

### 1. MCP Server

- **Technology**: Node.js + TypeScript + Express
- **Port**: 3001 (or configurable)
- **Protocol**: HTTP with Server-Sent Events (SSE)
- **Purpose**: Bridge between ChatGPT and CraftLocal backend

**Key Responsibilities**:

- Register and expose tools to ChatGPT
- Validate OAuth tokens
- Route requests to appropriate backend services
- Serve widget resources
- Handle real-time updates via SSE

### 2. OAuth 2.1 Authentication

- **Provider**: Auth0 (recommended) or Supabase Auth
- **Flow**: Authorization Code with PKCE
- **Scopes**:
  - `listings.read` - View product listings
  - `listings.write` - Create/edit listings (seller)
  - `orders.read` - View order history
  - `orders.write` - Create orders
  - `seller.manage` - Full seller capabilities

**Discovery Endpoints**:

- `/.well-known/oauth-protected-resource` - Resource metadata
- `/.well-known/openid-configuration` - OIDC configuration
- `/.well-known/jwks.json` - Public keys for token verification

### 3. API Layer

**Existing Supabase Functions** (Enhanced for MCP):

- Listing management
- Order processing
- Payment handling
- User management

**New Endpoints Required**:

- `GET /api/v1/listings/search` - Enhanced search with filters
- `POST /checkout_sessions` - Create checkout session
- `POST /checkout_sessions/:id` - Update checkout
- `POST /checkout_sessions/:id/complete` - Complete purchase
- `GET /api/v1/sellers/dashboard` - Seller analytics

### 4. Stripe Agentic Commerce

- **Purpose**: Enable instant checkout in ChatGPT
- **Method**: Shared Payment Tokens
- **Flow**:
  1. Create checkout session
  2. User provides shipping info
  3. Calculate tax and shipping
  4. Complete with payment token from ChatGPT
  5. Process payment and create order

### 5. React Widgets

**7 Interactive Widgets**:

1. **Product Grid** - Browse search results
2. **Product Detail** - View single product
3. **Checkout** - Complete purchase flow
4. **Order List** - View order history
5. **Order Detail** - Single order view
6. **Listing Form** - Create/edit products
7. **Seller Dashboard** - Analytics view

**Widget Requirements**:

- Responsive (mobile + desktop)
- Max height constraint support
- Light/dark theme support
- No localStorage usage
- CSP compliant

## MCP Tools Definition

### Browsing Tools (No Auth)

1. **search_listings**

   - Input: query, category, price_min, price_max, city
   - Output: Array of listings with metadata
   - Widget: Product Grid

2. **get_listing**
   - Input: listing_id
   - Output: Full product details
   - Widget: Product Detail

### Authenticated Tools

3. **get_orders** (OAuth: orders.read)

   - Input: user_id (from token)
   - Output: Array of orders
   - Widget: Order List

4. **get_order** (OAuth: orders.read)
   - Input: order_id
   - Output: Full order details
   - Widget: Order Detail

### Seller Tools

5. **create_listing** (OAuth: listings.write)

   - Input: title, description, price, images, etc.
   - Output: Created listing
   - Widget: Listing Form

6. **update_listing** (OAuth: listings.write)

   - Input: listing_id, updates
   - Output: Updated listing

7. **delete_listing** (OAuth: listings.write)

   - Input: listing_id
   - Output: Success confirmation

8. **get_seller_stats** (OAuth: seller.manage)
   - Input: seller_id (from token)
   - Output: Dashboard data
   - Widget: Seller Dashboard

### Checkout Tools

9. **create_checkout** (OAuth: optional)

   - Input: listing_id, quantity
   - Output: Checkout session
   - Widget: Checkout

10. **complete_checkout** (OAuth: optional)
    - Input: session_id, payment_token, shipping_address
    - Output: Order confirmation

## Security Architecture

### Authentication Flow

1. User initiates OAuth in ChatGPT
2. ChatGPT redirects to CraftLocal OAuth provider
3. User signs in and authorizes scopes
4. OAuth provider returns authorization code
5. ChatGPT exchanges code for access token
6. Token sent with each MCP request

### Token Verification

- JWT signature validation using JWKS
- Expiration checking
- Scope validation per tool
- Rate limiting per user
- Audit logging

### CSP (Content Security Policy)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' https://craftlocal.net https://cdn.craftlocal.net data:;
connect-src 'self' https://api.craftlocal.net https://api.stripe.com;
font-src 'self';
frame-ancestors 'none';
```

## Data Flow Examples

### Example 1: Guest Browsing

```
User: "Show me handmade mugs under $30"
  ↓
ChatGPT → search_listings(query="handmade mugs", price_max=30)
  ↓
MCP Server → Supabase Function (search)
  ↓
Returns: Array of listings
  ↓
MCP Server → Generates Product Grid Widget
  ↓
ChatGPT → Displays interactive grid to user
```

### Example 2: Authenticated Purchase

```
User: "I want to buy this"
  ↓
ChatGPT → create_checkout(listing_id="123")
[Validates OAuth token]
  ↓
MCP Server → Creates checkout session
  ↓
Returns: Checkout widget with form
  ↓
User: Fills shipping info
  ↓
ChatGPT → complete_checkout(session_id, payment_token, address)
  ↓
MCP Server → Stripe Agentic Commerce
  ↓
Process payment → Create order → Update inventory
  ↓
Returns: Order confirmation
```

### Example 3: Seller Creating Listing

```
User: "I want to list a handmade ceramic mug for $25"
  ↓
ChatGPT → create_listing(title="Handmade Ceramic Mug", price=25, ...)
[Validates OAuth token with listings.write scope]
  ↓
MCP Server → Supabase Function (create listing)
  ↓
Creates listing in database
  ↓
Returns: Created listing with ID
  ↓
ChatGPT → "Your listing has been created! ID: 456"
```

## Deployment Architecture

### Production Environment

- **MCP Server**: Fly.io / Render / Railway
- **Database**: Existing Supabase
- **OAuth**: Auth0 or Supabase Auth
- **Widgets**: CDN (CloudFront or Cloudflare)
- **Monitoring**: Sentry + DataDog

### Scaling Considerations

- MCP Server: Auto-scale based on CPU/memory
- Session storage: Redis for checkout sessions
- Rate limiting: Redis-backed
- Widget caching: CDN with long TTL

### Health Checks

- MCP Server: `/health` endpoint
- OAuth Provider: Discovery endpoints
- Database: Connection pool monitoring
- Stripe: Webhook health

## Performance Targets

- MCP endpoint response: < 500ms p95
- API calls: < 200ms p95
- Widget initial load: < 3s
- Checkout completion: < 5s total

## Monitoring & Observability

- Request logging: All MCP tool invocations
- Error tracking: Sentry for exceptions
- APM: DataDog/New Relic for performance
- Business metrics: Tool usage, conversion rates
- Alerts: Downtime, error rate spikes, latency degradation

## Next Steps

See individual documents:

- `api-inventory.md` - Complete API endpoint documentation
- `tool-specifications.md` - Detailed tool schemas
- `widget-specifications.md` - Widget component specs
- `oauth-implementation.md` - OAuth setup guide
