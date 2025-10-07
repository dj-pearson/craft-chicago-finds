# MCP Tool Specifications for CraftLocal

## Overview

This document defines all Model Context Protocol (MCP) tools that ChatGPT can invoke when interacting with CraftLocal marketplace.

## Tool Design Principles

1. **Clear Purpose**: Each tool does one thing well
2. **Natural Language Friendly**: Tool names and descriptions optimized for LLM understanding
3. **Graceful Errors**: Return helpful error messages
4. **Widget-First**: Most tools return widgets for rich UX
5. **Progressive Disclosure**: Start simple, reveal complexity as needed

---

## 1. search_listings

**Purpose**: Search and browse product listings

**Category**: Browsing (No Auth Required)

**Description for ChatGPT**:

> Search the CraftLocal marketplace for handmade artisan products. You can search by keywords, filter by category, price range, and location. Use this tool when users want to find products, browse items, or discover what's available.

**Input Schema** (Zod):

```typescript
{
  query: z.string().optional().describe("Search keywords (e.g., 'ceramic mug', 'handmade jewelry')"),
  category: z.string().optional().describe("Category filter (e.g., 'jewelry', 'home-decor', 'art')"),
  price_min: z.number().optional().describe("Minimum price in USD"),
  price_max: z.number().optional().describe("Maximum price in USD"),
  city_id: z.string().optional().describe("Filter by city"),
  sort_by: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional().default("popular"),
  limit: z.number().optional().default(20).describe("Number of results (default 20, max 50)"),
  offset: z.number().optional().default(0).describe("Pagination offset")
}
```

**Output Schema**:

```typescript
{
  listings: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    seller: {
      id: string;
      name: string;
      city: string;
      rating: number;
    };
    category: string;
    tags: string[];
    in_stock: boolean;
  }>;
  total_count: number;
  has_more: boolean;
  widget: {
    type: "product_grid";
    html: string; // Widget HTML
  }
}
```

**Example Prompts** (Golden Prompts):

- ✅ "Show me handmade mugs under $30"
- ✅ "Find jewelry in Chicago"
- ✅ "I'm looking for unique home decor"
- ✅ "What ceramic art is available?"
- ✅ "Browse gifts under $50"

**Expected Behavior**:

- If no `query` provided, show popular/recent items
- Fuzzy matching on keywords
- Natural language price parsing ("under $30" → `price_max: 30`)
- Return empty array if no results, not error
- Include widget for visual browsing

---

## 2. get_listing

**Purpose**: View detailed information about a specific product

**Category**: Browsing (No Auth Required)

**Description for ChatGPT**:

> Get complete details about a specific product listing including description, pricing, seller information, reviews, and purchase options. Use this when users want to know more about a particular item or are ready to make a purchase.

**Input Schema**:

```typescript
{
  listing_id: z.string().describe("The unique ID of the listing");
}
```

**Output Schema**:

```typescript
{
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    seller: {
      id: string;
      shop_name: string;
      city: string;
      rating: number;
      total_reviews: number;
    };
    category: string;
    tags: string[];
    stock: number;
    shipping_enabled: boolean;
    shipping_cost: number;
    pickup_enabled: boolean;
    lead_time_days: number;
    created_at: string;
    reviews_summary: {
      average_rating: number;
      total_reviews: number;
      recent_reviews: Array<{
        rating: number;
        comment: string;
        reviewer_name: string;
        date: string;
      }>;
    };
  };
  widget: {
    type: "product_detail";
    html: string;
  };
}
```

**Example Prompts**:

- ✅ "Tell me more about listing #abc123"
- ✅ "Show me the details"
- ✅ "What's the return policy for this item?"
- ✅ "How much does shipping cost?"

**Expected Behavior**:

- Return 404-equivalent if listing not found or inactive
- Include full seller information for trust
- Show shipping options clearly
- Display recent reviews for social proof

---

## 3. create_checkout

**Purpose**: Start the checkout process for purchasing an item

**Category**: Commerce (Optional Auth)

**Description for ChatGPT**:

> Initialize the checkout process for a product. Users can checkout as guests or authenticated users. This creates a checkout session and returns an interactive checkout widget. Use this when users indicate they want to buy something.

**Auth**: Optional (guest or OAuth token)

**Input Schema**:

```typescript
{
  listing_id: z.string().describe("The product to purchase"),
  quantity: z.number().optional().default(1).describe("Quantity to purchase (default 1)"),
  variant: z.string().optional().describe("Product variant if applicable (size, color, etc.)")
}
```

**Output Schema**:

```typescript
{
  checkout_session: {
    id: string;
    listing_id: string;
    quantity: number;
    subtotal: number;
    expires_at: string; // ISO timestamp
    status: "pending";
  }
  widget: {
    type: "checkout";
    html: string; // Interactive checkout form
  }
}
```

**Example Prompts**:

- ✅ "I want to buy this"
- ✅ "Purchase this item"
- ✅ "Add to cart and checkout"
- ✅ "How do I buy this?"

**Expected Behavior**:

- Create session that expires in 30 minutes
- If authenticated, pre-fill user info
- If guest, require email
- Show shipping/pickup options based on listing
- Display interactive checkout widget

---

## 4. complete_checkout

**Purpose**: Finalize purchase with payment and shipping information

**Category**: Commerce (Auto-invoked by Checkout Widget)

**Description for ChatGPT**:

> Complete the checkout process with payment information and shipping address. This tool is typically invoked automatically by the checkout widget when the user submits payment. Do not call this directly unless the user explicitly provides all required information.

**Auth**: Optional (matches create_checkout session)

**Input Schema**:

```typescript
{
  session_id: z.string().describe("Checkout session ID from create_checkout"),
  shipping_address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default("US")
  }).optional().describe("Required if shipping selected"),
  shipping_method: z.enum(["standard", "expedited", "pickup"]).describe("Fulfillment method"),
  pickup_notes: z.string().optional().describe("Notes for pickup (if applicable)"),
  payment_token: z.string().describe("Stripe payment token from ChatGPT"),
  email: z.string().email().optional().describe("Required for guest checkout")
}
```

**Output Schema**:

```typescript
{
  order: {
    id: string;
    confirmation_number: string;
    total: number;
    payment_status: "succeeded" | "processing" | "failed";
    estimated_delivery: string; // Date
    tracking_url: string | null;
  }
  message: string; // Success or error message
  widget: {
    type: "order_confirmation";
    html: string; // Confirmation page
  }
}
```

**Example Prompts**:

- ⚠️ Usually auto-invoked by widget
- ✅ "Complete my purchase with [payment info]" (rare)

**Expected Behavior**:

- Validate session is still valid (not expired)
- Process payment via Stripe Agentic Commerce
- Create order in database
- Update inventory (decrement stock)
- Send confirmation email
- If payment fails, return error but keep session alive
- If success, invalidate session

---

## 5. get_orders

**Purpose**: View user's order history

**Category**: Orders (Auth Required: `orders.read`)

**Description for ChatGPT**:

> Retrieve the authenticated user's order history. Shows both purchases (if buyer) and sales (if seller). Use this when users want to check their orders, track shipments, or review past purchases.

**Auth**: Required (OAuth token)

**Input Schema**:

```typescript
{
  status: z.enum(["all", "pending", "shipped", "delivered", "cancelled"]).optional().default("all"),
  role: z.enum(["buyer", "seller"]).optional().describe("Auto-detected from token, filter by role"),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0)
}
```

**Output Schema**:

```typescript
{
  orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    estimated_delivery: string | null;
    items: Array<{
      listing_id: string;
      title: string;
      image: string;
      quantity: number;
      price: number;
    }>;
    seller: {
      shop_name: string;
    } | null; // For buyer orders
    buyer: {
      name: string;
    } | null; // For seller orders
  }>;
  total_count: number;
  widget: {
    type: "order_list";
    html: string;
  }
}
```

**Example Prompts**:

- ✅ "Show my orders"
- ✅ "What did I buy last month?"
- ✅ "Check order status"
- ✅ "View my purchase history"
- ✅ (For sellers) "Show my sales"

**Expected Behavior**:

- Require authentication
- Auto-detect if user is viewing as buyer or seller
- Show most recent first
- Include order status clearly
- Provide tracking links if available

---

## 6. get_order_detail

**Purpose**: View detailed information about a specific order

**Category**: Orders (Auth Required: `orders.read`)

**Description for ChatGPT**:

> Get complete details about a specific order including items, shipping status, tracking information, and seller/buyer details. Use this when users ask about a specific order or want to track a shipment.

**Auth**: Required (OAuth token, must be buyer or seller)

**Input Schema**:

```typescript
{
  order_id: z.string().describe("The unique order ID");
}
```

**Output Schema**:

```typescript
{
  order: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
    items: Array<{
      listing_id: string;
      title: string;
      image: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    tax: number;
    shipping_cost: number;
    total: number;
    payment_status: string;
    shipping_address: object | null;
    tracking_number: string | null;
    tracking_url: string | null;
    estimated_delivery: string | null;
    seller: {
      shop_name: string;
      city: string;
    }
    buyer: {
      name: string;
      email: string;
    }
  }
  widget: {
    type: "order_detail";
    html: string;
  }
}
```

**Example Prompts**:

- ✅ "Where's my order #12345?"
- ✅ "Track my shipment"
- ✅ "Show order details"
- ✅ "When will it arrive?"

**Expected Behavior**:

- Verify user is authorized (buyer or seller)
- Return 404 if order not found or unauthorized
- Show real-time tracking if available
- Include seller contact for questions

---

## 7. create_listing

**Purpose**: Create a new product listing (sellers only)

**Category**: Seller Tools (Auth Required: `listings.write`)

**Description for ChatGPT**:

> Create a new product listing on the marketplace. Only available to sellers. Helps sellers list their handmade products by collecting all necessary information. Use this when sellers want to add new items to their shop.

**Auth**: Required (OAuth: `listings.write`)

**Input Schema**:

```typescript
{
  title: z.string().min(5).max(100).describe("Product title"),
  description: z.string().min(20).describe("Detailed product description"),
  price: z.number().positive().describe("Price in USD"),
  category_id: z.string().describe("Product category"),
  city_id: z.string().describe("City where product is located"),
  images: z.array(z.string().url()).optional().describe("Array of image URLs"),
  tags: z.array(z.string()).optional().describe("Product tags for discovery"),
  stock: z.number().int().positive().optional().default(1),
  shipping_enabled: z.boolean().optional().default(false),
  shipping_cost: z.number().optional().describe("Flat shipping rate if shipping_enabled"),
  pickup_enabled: z.boolean().optional().default(true),
  lead_time_days: z.number().int().optional().default(1).describe("Days to prepare order"),
  materials: z.array(z.string()).optional(),
  dimensions: z.string().optional(),
  weight: z.number().optional().describe("Weight in ounces")
}
```

**Output Schema**:

```typescript
{
  listing: {
    id: string;
    title: string;
    price: number;
    status: "pending_review" | "active";
    url: string;
  }
  message: string;
  widget: {
    type: "listing_confirmation";
    html: string;
  }
}
```

**Example Prompts**:

- ✅ "I want to list a handmade ceramic mug for $25"
- ✅ "Create a listing for my jewelry"
- ✅ "Add a new product to my shop"
- ✅ "Sell my artwork"

**Expected Behavior**:

- Validate seller authentication
- Require all mandatory fields
- If information missing, ask follow-up questions
- Create listing in "pending_review" status (if moderation enabled)
- Return listing URL for sharing
- Guide seller through image upload if needed

---

## 8. update_listing

**Purpose**: Update an existing product listing

**Category**: Seller Tools (Auth Required: `listings.write`)

**Description for ChatGPT**:

> Update an existing product listing. Sellers can change price, description, stock, or other details. Use this when sellers want to edit their products.

**Auth**: Required (OAuth: `listings.write`, must own listing)

**Input Schema**:

```typescript
{
  listing_id: z.string().describe("ID of listing to update"),
  updates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().optional(),
    shipping_cost: z.number().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["active", "draft", "sold"]).optional()
  })
}
```

**Output Schema**:

```typescript
{
  listing: {
    id: string;
    title: string;
    price: number;
    status: string;
  }
  message: string;
}
```

**Example Prompts**:

- ✅ "Update the price to $30"
- ✅ "Change the description of my listing"
- ✅ "Mark this as sold"
- ✅ "Add more stock"

---

## 9. delete_listing

**Purpose**: Remove a listing from the marketplace

**Category**: Seller Tools (Auth Required: `listings.write`)

**Description for ChatGPT**:

> Delete a product listing. This is a soft delete - the listing is marked as deleted but data is preserved. Use this when sellers want to remove items from their shop.

**Auth**: Required (OAuth: `listings.write`, must own listing)

**Input Schema**:

```typescript
{
  listing_id: z.string().describe("ID of listing to delete"),
  reason: z.string().optional().describe("Optional reason for deletion")
}
```

**Output Schema**:

```typescript
{
  success: boolean;
  message: string;
}
```

**Example Prompts**:

- ✅ "Delete this listing"
- ✅ "Remove my product"
- ✅ "Take down this item"

---

## 10. get_seller_dashboard

**Purpose**: View seller analytics and statistics

**Category**: Seller Tools (Auth Required: `seller.manage`)

**Description for ChatGPT**:

> Get seller dashboard with sales analytics, active listings, pending orders, and performance metrics. Use this when sellers want to check their shop performance or manage their business.

**Auth**: Required (OAuth: `seller.manage`)

**Input Schema**:

```typescript
{
  time_period: z.enum(["7d", "30d", "90d", "1y", "all"])
    .optional()
    .default("30d");
}
```

**Output Schema**:

```typescript
{
  dashboard: {
    total_sales: number;
    sales_count: number;
    active_listings: number;
    pending_orders: number;
    average_rating: number;
    sales_chart: Array<{ date: string; amount: number }>;
    top_products: Array<{
      listing_id: string;
      title: string;
      sales: number;
      revenue: number;
    }>;
    recent_orders: Array<{
      order_id: string;
      total: number;
      status: string;
      created_at: string;
    }>;
  }
  widget: {
    type: "seller_dashboard";
    html: string;
  }
}
```

**Example Prompts**:

- ✅ "Show my seller dashboard"
- ✅ "How much have I sold this month?"
- ✅ "What are my top products?"
- ✅ "Check my shop performance"

---

## Tool Selection Guidelines

### When to Use Which Tool

**User wants to find products**:

- Use `search_listings` with appropriate filters

**User asks about specific product**:

- Use `get_listing` with listing ID

**User wants to buy**:

- Use `create_checkout` → Widget handles the rest → `complete_checkout`

**User checks orders**:

- Use `get_orders` for list, `get_order_detail` for specific order

**Seller wants to list product**:

- Use `create_listing` with guided conversation to collect info

**Seller wants to manage shop**:

- Use `get_seller_dashboard` for overview
- Use `update_listing` or `delete_listing` for specific items

## Error Handling

All tools should return errors in this format:

```typescript
{
  error: {
    code: string; // e.g., "NOT_FOUND", "UNAUTHORIZED", "VALIDATION_ERROR"
    message: string; // Human-readable message
    details: object; // Additional context
  }
}
```

Common error codes:

- `NOT_FOUND`: Resource doesn't exist
- `UNAUTHORIZED`: Auth required or insufficient permissions
- `VALIDATION_ERROR`: Input validation failed
- `OUT_OF_STOCK`: Product not available
- `PAYMENT_FAILED`: Payment processing error
- `SESSION_EXPIRED`: Checkout session expired

## Testing Requirements

Each tool must have:

1. **Golden Prompt Tests**: Direct, indirect, and negative prompts
2. **Unit Tests**: Input validation and output schemas
3. **Integration Tests**: End-to-end with real/mocked API
4. **Performance Tests**: Response time < 500ms p95
5. **Error Tests**: All error conditions handled gracefully
