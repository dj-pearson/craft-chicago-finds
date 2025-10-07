# CraftLocal API Inventory & Gap Analysis

## Existing Supabase Edge Functions

### ✅ Payment & Checkout

| Endpoint                  | Method | Status    | MCP Ready            |
| ------------------------- | ------ | --------- | -------------------- |
| `create-payment-intent`   | POST   | ✅ Exists | ✅ Ready             |
| `create-checkout-session` | POST   | ✅ Exists | ✅ Ready             |
| `create-cart-checkout`    | POST   | ✅ Exists | ✅ Ready             |
| `create-guest-checkout`   | POST   | ✅ Exists | ✅ Ready             |
| `create-express-checkout` | POST   | ✅ Exists | ⚠️ Needs Enhancement |
| `process-escrow-payment`  | POST   | ✅ Exists | ✅ Ready             |
| `release-escrow-payment`  | POST   | ✅ Exists | ✅ Ready             |
| `stripe-webhook`          | POST   | ✅ Exists | ✅ Ready             |

### ✅ Seller Management

| Endpoint                 | Method | Status    | MCP Ready     |
| ------------------------ | ------ | --------- | ------------- |
| `create-connect-account` | POST   | ✅ Exists | ✅ Ready      |
| `moderate-listing`       | POST   | ✅ Exists | ⚠️ Admin Only |

### ✅ Content & AI

| Endpoint                   | Method | Status    | MCP Ready     |
| -------------------------- | ------ | --------- | ------------- |
| `ai-generate-content`      | POST   | ✅ Exists | ❌ Not Needed |
| `ai-generate-city-content` | POST   | ✅ Exists | ❌ Not Needed |
| `visual-search`            | POST   | ✅ Exists | ✅ Ready      |

### ✅ Subscriptions & Plans

| Endpoint              | Method | Status    | MCP Ready |
| --------------------- | ------ | --------- | --------- |
| `create-subscription` | POST   | ✅ Exists | ✅ Ready  |
| `cancel-subscription` | POST   | ✅ Exists | ✅ Ready  |

### ✅ Orders & Disputes

| Endpoint              | Method | Status    | MCP Ready     |
| --------------------- | ------ | --------- | ------------- |
| `update-order-status` | POST   | ✅ Exists | ✅ Ready      |
| `resolve-dispute`     | POST   | ✅ Exists | ⚠️ Admin Only |

### ✅ Utilities

| Endpoint           | Method | Status    | MCP Ready     |
| ------------------ | ------ | --------- | ------------- |
| `optimize-image`   | POST   | ✅ Exists | ✅ Ready      |
| `generate-sitemap` | POST   | ✅ Exists | ❌ Not Needed |

## Existing Database Tables (Direct Access via Supabase Client)

### ✅ Core Tables

- `profiles` - User profiles
- `listings` - Product listings
- `categories` - Product categories
- `orders` - Order records
- `order_items` - Individual items in orders
- `reviews` - Product reviews
- `messages` - Buyer-seller messages
- `cities` - City data
- `user_roles` - RBAC roles

### Query Capabilities

All tables support:

- ✅ Filtering (`.eq()`, `.gt()`, `.lt()`, `.gte()`, `.lte()`)
- ✅ Text search (`.ilike()`, `.textSearch()`)
- ✅ Ordering (`.order()`)
- ✅ Pagination (`.range()`)
- ✅ Joins (`.select()` with relations)

## Gap Analysis: Missing Endpoints for MCP

### 🔴 HIGH PRIORITY - Required for MVP

#### 1. Enhanced Listing Search

**Endpoint**: `GET /api/mcp/listings/search`

- **Purpose**: Unified search endpoint optimized for ChatGPT queries
- **Inputs**:
  - `query` (string): Natural language search
  - `category` (string, optional): Category filter
  - `price_min` (number, optional)
  - `price_max` (number, optional)
  - `city_id` (string, optional)
  - `sort_by` (string, optional): "newest", "price_asc", "price_desc", "popular"
  - `limit` (number, default: 20)
  - `offset` (number, default: 0)
- **Output**: Paginated listing array with metadata
- **Status**: ❌ Need to Create
- **Implementation**: Wrap existing search logic in MCP-optimized endpoint

#### 2. Get Single Listing

**Endpoint**: `GET /api/mcp/listings/:id`

- **Purpose**: Retrieve full details of a single listing
- **Inputs**: `listing_id` (path parameter)
- **Output**: Complete listing object with seller info
- **Status**: ⚠️ Can use Supabase direct, but MCP endpoint preferred
- **Implementation**: Query `listings` table with seller profile join

#### 3. Get User Orders

**Endpoint**: `GET /api/mcp/orders`

- **Purpose**: List all orders for authenticated user
- **Auth**: Required (OAuth token)
- **Inputs**:
  - `role` (auto-detected): "buyer" or "seller"
  - `status` (string, optional): Filter by order status
  - `limit` (number, default: 20)
- **Output**: Array of orders with items
- **Status**: ⚠️ Can use Supabase direct, but MCP endpoint preferred

#### 4. Get Single Order

**Endpoint**: `GET /api/mcp/orders/:id`

- **Purpose**: Get detailed order information
- **Auth**: Required (OAuth token, must be buyer or seller)
- **Inputs**: `order_id` (path parameter)
- **Output**: Complete order with items, shipping, seller/buyer info
- **Status**: ⚠️ Can use Supabase direct, but MCP endpoint preferred

#### 5. Create Listing

**Endpoint**: `POST /api/mcp/sellers/listings`

- **Purpose**: Create new product listing
- **Auth**: Required (OAuth: `listings.write`)
- **Inputs**:
  - `title` (string, required)
  - `description` (string, required)
  - `price` (number, required)
  - `category_id` (string, required)
  - `city_id` (string, required)
  - `images` (array of URLs, optional)
  - `stock` (number, default: 1)
  - `shipping_enabled` (boolean)
  - `pickup_enabled` (boolean)
  - `tags` (array of strings)
- **Output**: Created listing object
- **Status**: ⚠️ Can use Supabase direct, but validation needed

#### 6. Update Listing

**Endpoint**: `PUT /api/mcp/sellers/listings/:id`

- **Purpose**: Update existing listing
- **Auth**: Required (OAuth: `listings.write`, must own listing)
- **Inputs**: Partial listing object
- **Output**: Updated listing
- **Status**: ⚠️ Can use Supabase direct, but auth check needed

#### 7. Delete Listing

**Endpoint**: `DELETE /api/mcp/sellers/listings/:id`

- **Purpose**: Delete listing (soft delete)
- **Auth**: Required (OAuth: `listings.write`, must own listing)
- **Inputs**: `listing_id` (path parameter)
- **Output**: Success confirmation
- **Status**: ⚠️ Can use Supabase direct, but auth check needed

#### 8. Get Seller Dashboard Stats

**Endpoint**: `GET /api/mcp/sellers/dashboard`

- **Purpose**: Retrieve seller analytics and metrics
- **Auth**: Required (OAuth: `seller.manage`)
- **Output**:
  - Total sales (30 days, all time)
  - Active listings count
  - Pending orders
  - Recent orders (last 10)
  - Sales chart data
  - Top products
- **Status**: ❌ Need to Create

### 🟡 MEDIUM PRIORITY - Agentic Commerce

#### 9. Create Checkout Session (Agentic)

**Endpoint**: `POST /api/mcp/checkout_sessions`

- **Purpose**: Initialize Stripe Agentic Commerce session
- **Auth**: Optional (can checkout as guest)
- **Inputs**:
  - `listing_id` (string)
  - `quantity` (number, default: 1)
  - `metadata` (object, optional)
- **Output**:
  - `session_id` (string)
  - `amount` (number)
  - `currency` (string)
  - `expires_at` (timestamp)
- **Status**: ❌ Need to Create
- **Implementation**: Create session in Redis/DB, return ID

#### 10. Update Checkout Session

**Endpoint**: `POST /api/mcp/checkout_sessions/:id`

- **Purpose**: Add shipping address and calculate final price
- **Inputs**:
  - `session_id` (path parameter)
  - `shipping_address` (object):
    - `line1`, `line2`, `city`, `state`, `zip`, `country`
  - `shipping_method` (string): "standard", "expedited", "pickup"
- **Output**:
  - Updated session with:
    - `subtotal` (number)
    - `tax` (number)
    - `shipping_cost` (number)
    - `total` (number)
- **Status**: ❌ Need to Create
- **Implementation**: Calculate tax (TaxJar?), shipping, update session

#### 11. Complete Checkout

**Endpoint**: `POST /api/mcp/checkout_sessions/:id/complete`

- **Purpose**: Finalize purchase with Stripe payment token
- **Inputs**:
  - `session_id` (path parameter)
  - `payment_token` (string): Shared Payment Token from ChatGPT
  - `email` (string, if guest)
- **Output**:
  - `order_id` (string)
  - `payment_status` (string)
  - `confirmation_number` (string)
- **Status**: ❌ Need to Create
- **Implementation**:
  1. Validate session
  2. Process payment with Stripe token
  3. Create order in DB
  4. Update inventory
  5. Send confirmation email

### 🟢 LOW PRIORITY - Nice to Have

#### 12. Get Categories

**Endpoint**: `GET /api/mcp/categories`

- **Purpose**: List all product categories
- **Output**: Hierarchical category tree
- **Status**: ⚠️ Can use Supabase direct

#### 13. Cancel Order

**Endpoint**: `POST /api/mcp/orders/:id/cancel`

- **Purpose**: Cancel an order
- **Auth**: Required (must be buyer, order must be cancellable)
- **Status**: ⚠️ Can implement via Supabase RPC

#### 14. Get Order Tracking

**Endpoint**: `GET /api/mcp/orders/:id/tracking`

- **Purpose**: Get shipment tracking information
- **Status**: ⚠️ Can query shipments table

## OAuth Endpoints (Required)

### 🔴 HIGH PRIORITY

#### 15. OAuth Authorization Endpoint

**Endpoint**: `GET /.well-known/oauth-protected-resource`

- **Purpose**: Resource metadata for ChatGPT
- **Output**:
  ```json
  {
    "resource": "https://mcp.craftlocal.net",
    "authorization_endpoint": "https://oauth.craftlocal.net/authorize",
    "token_endpoint": "https://oauth.craftlocal.net/token",
    "revocation_endpoint": "https://oauth.craftlocal.net/revoke",
    "scopes_supported": [
      "listings.read",
      "listings.write",
      "orders.read",
      "orders.write",
      "seller.manage"
    ]
  }
  ```
- **Status**: ❌ Need to Create

#### 16. OpenID Configuration

**Endpoint**: `GET /.well-known/openid-configuration`

- **Purpose**: OIDC discovery endpoint
- **Status**: ✅ May exist if using Supabase Auth, or ❌ need to create

#### 17. JWKS Endpoint

**Endpoint**: `GET /.well-known/jwks.json`

- **Purpose**: Public keys for JWT verification
- **Status**: ✅ May exist if using Supabase Auth, or ❌ need to create

## Implementation Plan

### Phase 1: Core Browsing (Week 1-2)

1. ✅ Use existing Supabase client for listings read
2. ❌ Create MCP wrapper endpoints for search
3. ⚠️ Enhance search for natural language queries

### Phase 2: Authentication (Week 2-3)

1. ❌ Set up OAuth provider (Auth0 or Supabase)
2. ❌ Implement discovery endpoints
3. ❌ Build token verification middleware

### Phase 3: Authenticated Features (Week 3-4)

1. ⚠️ Create MCP endpoints for orders
2. ⚠️ Create MCP endpoints for seller operations
3. ❌ Implement seller dashboard endpoint

### Phase 4: Checkout (Week 4-5)

1. ❌ Implement Agentic Commerce session endpoints
2. ❌ Integrate tax calculation
3. ❌ Complete checkout flow with Stripe tokens

## Notes

- Most read operations can use existing Supabase client directly
- Write operations need validation and auth middleware
- Agentic Commerce is net new implementation
- OAuth setup is critical path dependency
