# Phase 4: Database Setup ✅

## Overview
Created the core marketplace database schema with real tables, RLS policies, and seed data for products, categories, cart, orders, and user management.

## Database Schema

### Tables Created

#### 1. **profiles**
User profile data extending auth.users
- `id` - UUID primary key
- `user_id` - UUID (unique, references auth user)
- `display_name` - Text
- `avatar_url` - Text
- `bio` - Text
- `city` - Text
- `is_artisan` - Boolean (default: false)
- Timestamps: `created_at`, `updated_at`

**RLS Policies:**
- Public can view all profiles
- Users can insert their own profile
- Users can update their own profile

#### 2. **categories**
Product categories
- `id` - UUID primary key
- `name` - Text (unique)
- `slug` - Text (unique)
- `description` - Text
- `icon_name` - Text (for Lucide icons)
- `display_order` - Integer
- `created_at` - Timestamp

**RLS Policies:**
- Public read access

**Seeded Categories:**
- Jewelry
- Home Decor
- Pottery & Ceramics
- Textiles
- Art & Prints
- Candles & Soaps
- Woodwork
- Leather Goods

#### 3. **products**
Artisan products
- `id` - UUID primary key
- `artisan_id` - UUID (references user)
- `category_id` - UUID (references categories)
- `title` - Text
- `slug` - Text
- `description` - Text
- `price` - Decimal(10,2)
- `original_price` - Decimal(10,2) (for sales)
- `stock_quantity` - Integer
- `main_image_url` - Text
- `images` - JSONB array
- `is_active` - Boolean
- `featured` - Boolean
- `tags` - Text array
- Timestamps: `created_at`, `updated_at`

**RLS Policies:**
- Public can view active products
- Artisans can view their own inactive products
- Artisans can insert/update/delete their own products

**Indexes:**
- `idx_products_artisan` on artisan_id
- `idx_products_category` on category_id
- `idx_products_active` on is_active
- `idx_products_featured` on featured

#### 4. **cart_items**
Shopping cart
- `id` - UUID primary key
- `user_id` - UUID
- `product_id` - UUID (references products)
- `quantity` - Integer (min: 1)
- Timestamps: `created_at`, `updated_at`
- Unique constraint on (user_id, product_id)

**RLS Policies:**
- Users can fully manage their own cart items

**Indexes:**
- `idx_cart_items_user` on user_id

#### 5. **favorites**
User wishlist
- `id` - UUID primary key
- `user_id` - UUID
- `product_id` - UUID (references products)
- `created_at` - Timestamp
- Unique constraint on (user_id, product_id)

**RLS Policies:**
- Users can view/add/remove their own favorites

**Indexes:**
- `idx_favorites_user` on user_id

#### 6. **orders**
Purchase orders
- `id` - UUID primary key
- `user_id` - UUID
- `total_amount` - Decimal(10,2)
- `status` - Text (pending/processing/shipped/delivered/cancelled)
- `shipping_address` - JSONB
- Timestamps: `created_at`, `updated_at`

**RLS Policies:**
- Users can view their own orders
- Users can create their own orders

**Indexes:**
- `idx_orders_user` on user_id

#### 7. **order_items**
Individual items in orders
- `id` - UUID primary key
- `order_id` - UUID (references orders)
- `product_id` - UUID (references products)
- `quantity` - Integer
- `price` - Decimal(10,2) (snapshot of price at time of order)
- `created_at` - Timestamp

**RLS Policies:**
- Users can view order items for their own orders

**Indexes:**
- `idx_order_items_order` on order_id

#### 8. **reviews**
Product reviews
- `id` - UUID primary key
- `product_id` - UUID (references products)
- `user_id` - UUID
- `rating` - Integer (1-5)
- `comment` - Text
- Timestamps: `created_at`, `updated_at`
- Unique constraint on (product_id, user_id)

**RLS Policies:**
- Public can view all reviews
- Users can create/update/delete their own reviews

**Indexes:**
- `idx_reviews_product` on product_id

## Automatic Features

### Triggers
All tables with `updated_at` have automatic timestamp update triggers:
- profiles
- products
- cart_items
- orders
- reviews

### Constraints
- Price validation (price >= 0)
- Stock validation (stock_quantity >= 0)
- Rating validation (1-5)
- Status validation for orders
- Unique constraints prevent duplicate cart items and favorites

## Seed Data

### File: `supabase/seed.sql`

**Categories Seeded:**
- 8 product categories with slugs and descriptions
- Display order set for consistent UI ordering
- Icon names for UI components

**Products Template:**
- Commented template for sample products
- Requires real user IDs from authenticated users
- Sample products include:
  - Sterling Silver Moon Phase Necklace
  - Macrame Wall Hanging
  - Ceramic Mug Set
  - Lavender & Vanilla Candle
  - Walnut Cutting Board
  - Leather Bifold Wallet
  - Abstract Watercolor Print
  - Hand-Woven Cotton Throw

## Data Integrity

### Foreign Keys
- Products reference categories (SET NULL on delete)
- Cart items reference products (CASCADE on delete)
- Favorites reference products (CASCADE on delete)
- Order items reference products (RESTRICT on delete)
- Order items reference orders (CASCADE on delete)

### Cascading Deletes
- Deleting a product removes associated cart items and favorites
- Deleting an order removes associated order items
- Product deletion restricted if in shipped orders

## Security

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

**Public Access:**
- Categories (read)
- Active products (read)
- Reviews (read)
- Profiles (read)

**User-Specific:**
- Cart items (full CRUD for own items)
- Favorites (full CRUD for own items)
- Orders (read/create own orders)
- Reviews (full CRUD for own reviews)

**Artisan-Specific:**
- Products (full CRUD for own products)
- Can view own inactive products

## Performance Optimizations

### Indexes
Created indexes on:
- Foreign keys for fast joins
- Filter columns (is_active, featured)
- User lookup columns

### Query Patterns
Optimized for:
- Product browsing by category
- Featured product queries
- User cart/favorites lookup
- Order history retrieval

## Next Steps

### To Use the Schema:

1. **Run the migration** (already completed)
   - Creates all tables
   - Sets up RLS policies
   - Creates indexes and triggers

2. **Seed categories:**
   ```sql
   -- Categories are already in seed.sql
   -- Run: psql -f supabase/seed.sql
   ```

3. **Add products:**
   - Users must be authenticated
   - Replace `YOUR_USER_ID` in seed.sql with actual user IDs
   - Or use the app UI to create products

4. **CRUD Operations Ready:**
   - Products API (after types regenerate)
   - Categories API (after types regenerate)
   - Cart API (after types regenerate)
   - Favorites API (after types regenerate)

### Authentication Required

Before full functionality works:
- ⚠️ **Authentication must be implemented**
- Users need to sign up/sign in
- Profile creation on signup
- RLS policies enforce user ownership

### API Implementation (Coming Next)

After Supabase types regenerate, implement:
- Product CRUD operations
- Category management
- Shopping cart functions
- Favorites/wishlist
- Order processing
- Review system

---

**Status**: ✅ COMPLETE
**Date**: 2025-01-15
**Next**: Wait for types to regenerate, then implement API layer and UI components
**Auth Required**: Yes - users must authenticate to use cart, favorites, and orders
