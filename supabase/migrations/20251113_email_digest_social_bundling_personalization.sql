-- Complete Remaining Features Migration
-- Created: 2025-11-13
-- Purpose: Email digest, social following, product bundling, and personalization

-- ============================================================================
-- EMAIL DIGEST PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_digest_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  frequency text CHECK (frequency IN ('daily', 'weekly', 'never')) DEFAULT 'weekly',
  categories text[] DEFAULT ARRAY[]::text[], -- Array of category IDs to follow
  include_new_makers boolean DEFAULT true,
  include_price_drops boolean DEFAULT true,
  include_trending boolean DEFAULT true,
  include_followed_shops boolean DEFAULT true,
  include_recommendations boolean DEFAULT true,
  last_sent timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_digest_user
ON email_digest_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_email_digest_frequency
ON email_digest_preferences(frequency, last_sent);

ALTER TABLE email_digest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email preferences"
ON email_digest_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
ON email_digest_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SHOP FOLLOWS (Social Feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, shop_owner_id),
  -- Prevent self-following
  CHECK (follower_id != shop_owner_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_follows_follower
ON shop_follows(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shop_follows_shop
ON shop_follows(shop_owner_id, created_at DESC);

ALTER TABLE shop_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
ON shop_follows FOR SELECT
USING (auth.uid() = follower_id);

CREATE POLICY "Users can follow shops"
ON shop_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow shops"
ON shop_follows FOR DELETE
USING (auth.uid() = follower_id);

-- ============================================================================
-- COLLECTION FOLLOWS (Social Feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS collection_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection_id uuid NOT NULL, -- Can reference featured_collections or other collections
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_follows_follower
ON collection_follows(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_follows_collection
ON collection_follows(collection_id, created_at DESC);

ALTER TABLE collection_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collection follows"
ON collection_follows FOR SELECT
USING (auth.uid() = follower_id);

CREATE POLICY "Users can follow collections"
ON collection_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow collections"
ON collection_follows FOR DELETE
USING (auth.uid() = follower_id);

-- ============================================================================
-- PRODUCT BUNDLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_bundles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  discount_percentage numeric CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount numeric CHECK (discount_amount >= 0),
  status text CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  total_price numeric GENERATED ALWAYS AS (0) STORED, -- Will be calculated by trigger
  discounted_price numeric GENERATED ALWAYS AS (0) STORED, -- Will be calculated by trigger
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_bundle_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id uuid REFERENCES product_bundles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(bundle_id, listing_id)
);

CREATE TABLE IF NOT EXISTS cart_bundles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id uuid NOT NULL, -- Reference to user's cart (can be session-based)
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id uuid REFERENCES product_bundles(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_bundles_seller
ON product_bundles(seller_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_bundle_items_bundle
ON product_bundle_items(bundle_id);

CREATE INDEX IF NOT EXISTS idx_cart_bundles_user
ON cart_bundles(user_id, created_at DESC);

-- RLS
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bundles"
ON product_bundles FOR SELECT
USING (status = 'active');

CREATE POLICY "Sellers can manage their bundles"
ON product_bundles FOR ALL
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Anyone can view bundle items for active bundles"
ON product_bundle_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM product_bundles
  WHERE product_bundles.id = bundle_id
  AND product_bundles.status = 'active'
));

CREATE POLICY "Sellers can manage their bundle items"
ON product_bundle_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM product_bundles
  WHERE product_bundles.id = bundle_id
  AND product_bundles.seller_id = auth.uid()
));

CREATE POLICY "Users can view their own cart bundles"
ON cart_bundles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart bundles"
ON cart_bundles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PERSONALIZATION OPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS personalization_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  option_type text NOT NULL CHECK (option_type IN ('text', 'dropdown', 'color', 'size', 'date')),
  label text NOT NULL,
  required boolean DEFAULT false,
  choices text[], -- For dropdown options
  max_length integer, -- For text options
  price_modifier numeric DEFAULT 0, -- Additional cost for this option
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_item_personalizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES personalization_options(id) ON DELETE SET NULL,
  option_label text NOT NULL, -- Stored in case option is deleted
  value text NOT NULL,
  price_modifier numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personalization_options_listing
ON personalization_options(listing_id, display_order);

CREATE INDEX IF NOT EXISTS idx_order_item_personalizations_order_item
ON order_item_personalizations(order_item_id);

-- RLS
ALTER TABLE personalization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_personalizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view personalization options for active listings"
ON personalization_options FOR SELECT
USING (EXISTS (
  SELECT 1 FROM listings
  WHERE listings.id = listing_id
  AND listings.status = 'active'
));

CREATE POLICY "Sellers can manage their listing personalization options"
ON personalization_options FOR ALL
USING (EXISTS (
  SELECT 1 FROM listings
  WHERE listings.id = listing_id
  AND listings.seller_id = auth.uid()
));

CREATE POLICY "Users can view personalizations for their orders"
ON order_item_personalizations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.id = order_item_id
  AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to notify followers of new listings
CREATE OR REPLACE FUNCTION notify_followers_new_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for all followers of this shop
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT
    sf.follower_id,
    'New listing from ' || p.display_name,
    NEW.title,
    'new_listing',
    CASE
      WHEN c.slug IS NOT NULL THEN '/' || c.slug || '/product/' || NEW.id
      ELSE '/product/' || NEW.id
    END
  FROM shop_follows sf
  JOIN profiles p ON p.id = NEW.seller_id
  LEFT JOIN cities c ON c.id = NEW.city_id
  WHERE sf.shop_owner_id = NEW.seller_id
    AND sf.notification_enabled = true
    AND NEW.status = 'active';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new listing notifications
DROP TRIGGER IF EXISTS trigger_notify_followers_new_listing ON listings;
CREATE TRIGGER trigger_notify_followers_new_listing
AFTER INSERT ON listings
FOR EACH ROW
EXECUTE FUNCTION notify_followers_new_listing();

-- Function to get follower count for a shop
CREATE OR REPLACE FUNCTION get_shop_follower_count(p_shop_owner_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM shop_follows
    WHERE shop_owner_id = p_shop_owner_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user follows a shop
CREATE OR REPLACE FUNCTION is_following_shop(p_follower_id uuid, p_shop_owner_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM shop_follows
    WHERE follower_id = p_follower_id
    AND shop_owner_id = p_shop_owner_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bundle price
CREATE OR REPLACE FUNCTION calculate_bundle_price(p_bundle_id uuid)
RETURNS TABLE (
  total_price numeric,
  discounted_price numeric
) AS $$
DECLARE
  v_total numeric := 0;
  v_discount_percentage numeric;
  v_discount_amount numeric;
  v_discounted numeric;
BEGIN
  -- Calculate total price from all items
  SELECT COALESCE(SUM(l.price * pbi.quantity), 0)
  INTO v_total
  FROM product_bundle_items pbi
  JOIN listings l ON l.id = pbi.listing_id
  WHERE pbi.bundle_id = p_bundle_id;

  -- Get discount settings
  SELECT pb.discount_percentage, pb.discount_amount
  INTO v_discount_percentage, v_discount_amount
  FROM product_bundles pb
  WHERE pb.id = p_bundle_id;

  -- Calculate discounted price
  IF v_discount_percentage IS NOT NULL AND v_discount_percentage > 0 THEN
    v_discounted := v_total * (1 - v_discount_percentage / 100);
  ELSIF v_discount_amount IS NOT NULL AND v_discount_amount > 0 THEN
    v_discounted := GREATEST(v_total - v_discount_amount, 0);
  ELSE
    v_discounted := v_total;
  END IF;

  RETURN QUERY SELECT v_total, v_discounted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_shop_follower_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_following_shop TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_bundle_price TO authenticated, anon;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'All remaining features created successfully!';
    RAISE NOTICE 'Email digest preferences, social following, bundling, and personalization ready.';
END $$;
