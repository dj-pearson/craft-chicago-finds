-- ========================================
-- COMPREHENSIVE RPC FUNCTIONS MIGRATION
-- Created: 2025-11-11
-- Purpose: Ensure all required RPC functions exist with fallback-compatible signatures
-- This migration is idempotent and can be run multiple times safely
-- ========================================

-- ========================================
-- 1. Get Top Categories with Stats
-- Used by: src/hooks/useAnalytics.tsx
-- ========================================
CREATE OR REPLACE FUNCTION get_top_categories_stats(limit_count INT DEFAULT 5)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  listing_count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    COUNT(DISTINCT l.id) as listing_count,
    COALESCE(SUM(o.total_amount), 0) as revenue
  FROM categories c
  LEFT JOIN listings l ON l.category_id = c.id
  LEFT JOIN orders o ON o.listing_id = l.id
  GROUP BY c.id, c.name
  ORDER BY revenue DESC, listing_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_top_categories_stats IS 'Gets top categories by revenue with listing counts. Has fallback in useAnalytics.tsx.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_top_categories_stats(INT) TO anon, authenticated;

-- ========================================
-- 2. Get Top Cities with Stats
-- Used by: src/hooks/useAnalytics.tsx
-- ========================================
CREATE OR REPLACE FUNCTION get_top_cities_stats(limit_count INT DEFAULT 5)
RETURNS TABLE (
  city_id UUID,
  city_name TEXT,
  user_count BIGINT,
  listing_count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.name,
    COUNT(DISTINCT p.user_id) as user_count,
    COUNT(DISTINCT l.id) as listing_count,
    COALESCE(SUM(o.total_amount), 0) as revenue
  FROM cities ci
  LEFT JOIN profiles p ON p.city_id = ci.id
  LEFT JOIN listings l ON l.city_id = ci.id
  LEFT JOIN orders o ON o.listing_id = l.id
  GROUP BY ci.id, ci.name
  ORDER BY revenue DESC, listing_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_top_cities_stats IS 'Gets top cities by revenue with user and listing counts. Has fallback in useAnalytics.tsx.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_top_cities_stats(INT) TO anon, authenticated;

-- ========================================
-- 3. Get Trending Categories
-- Used by: src/components/browse/CategoryTrends.tsx
-- ========================================
CREATE OR REPLACE FUNCTION get_trending_categories(
  p_city_id UUID,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_image_url TEXT,
  listing_count BIGINT,
  view_count BIGINT,
  average_rating NUMERIC,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH category_stats AS (
    SELECT
      c.id,
      c.name,
      c.slug,
      c.image_url,
      COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as listing_count,
      COALESCE(SUM(l.view_count), 0) as view_count,
      COALESCE(AVG(r.rating), 0) as average_rating,
      -- Simple growth rate based on recent activity
      COALESCE(
        (
          COUNT(DISTINCT l.id) FILTER (
            WHERE l.status = 'active'
            AND l.created_at >= NOW() - INTERVAL '15 days'
          )::FLOAT / NULLIF(
            COUNT(DISTINCT l.id) FILTER (
              WHERE l.status = 'active'
              AND l.created_at >= NOW() - INTERVAL '30 days'
              AND l.created_at < NOW() - INTERVAL '15 days'
            ), 0
          ) - 1
        ) * 100,
        0
      ) as growth_rate
    FROM categories c
    LEFT JOIN listings l ON l.category_id = c.id AND l.status = 'active'
    LEFT JOIN orders o ON o.listing_id = l.id
    LEFT JOIN reviews r ON r.order_id = o.id
    WHERE c.city_id = p_city_id
      AND c.is_active = true
    GROUP BY c.id, c.name, c.slug, c.image_url
    HAVING COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') > 0
  )
  SELECT
    cs.id,
    cs.name,
    cs.slug,
    cs.image_url,
    cs.listing_count,
    cs.view_count,
    cs.average_rating,
    cs.growth_rate
  FROM category_stats cs
  ORDER BY
    -- Weighted scoring: views (40%) + listings (30%) + growth (20%) + rating (10%)
    (cs.view_count * 0.4 +
     cs.listing_count * 0.3 +
     cs.growth_rate * 0.2 +
     cs.average_rating * 0.1) DESC,
    cs.listing_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_trending_categories IS 'Gets trending categories for a city with stats. Has fallback in CategoryTrends.tsx.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_trending_categories(UUID, INT) TO anon, authenticated;

-- ========================================
-- 4. Get Featured Collections
-- Used by: src/components/collections/FeaturedCollections.tsx
-- ========================================
CREATE OR REPLACE FUNCTION get_featured_collections(collection_limit INTEGER DEFAULT 6)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  slug TEXT,
  cover_image_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  category TEXT,
  item_count INTEGER,
  follow_count INTEGER,
  view_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.title,
    c.description,
    c.slug,
    c.cover_image_url,
    c.creator_id,
    p.display_name,
    p.avatar_url,
    c.category,
    COALESCE(c.item_count, 0)::INTEGER,
    COALESCE(c.follow_count, 0)::INTEGER,
    COALESCE(c.view_count, 0)::INTEGER,
    c.created_at
  FROM collections c
  LEFT JOIN profiles p ON c.creator_id = p.user_id
  WHERE c.is_public = true AND c.is_featured = true
  ORDER BY c.follow_count DESC, c.created_at DESC
  LIMIT collection_limit;
$$;

COMMENT ON FUNCTION get_featured_collections IS 'Gets featured collections with creator info. Has fallback in FeaturedCollections.tsx.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_featured_collections(INTEGER) TO anon, authenticated;

-- ========================================
-- 5. Additional Helper Functions
-- ========================================

-- Function to safely check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to safely check if a column exists
CREATE OR REPLACE FUNCTION column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
    AND column_name = $2
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- 6. Create missing indexes for performance
-- ========================================

-- Only create if they don't exist
DO $$
BEGIN
  -- Index for category stats queries
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_category_status_created') THEN
    CREATE INDEX idx_listings_category_status_created
      ON listings(category_id, status, created_at DESC)
      WHERE status = 'active';
  END IF;

  -- Index for city stats queries
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_listings_city_status') THEN
    CREATE INDEX idx_listings_city_status
      ON listings(city_id, status)
      WHERE status = 'active';
  END IF;

  -- Index for profiles by city
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_city_user') THEN
    CREATE INDEX idx_profiles_city_user
      ON profiles(city_id, user_id);
  END IF;

  -- Index for orders with listing join
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_listing_created') THEN
    CREATE INDEX idx_orders_listing_created
      ON orders(listing_id, created_at DESC);
  END IF;

  -- Index for reviews by order
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_order_rating') THEN
    CREATE INDEX idx_reviews_order_rating
      ON reviews(order_id, rating);
  END IF;

  -- Index for collections featured
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_collections_featured_public') THEN
    CREATE INDEX idx_collections_featured_public
      ON collections(is_featured, is_public, follow_count DESC, created_at DESC)
      WHERE is_public = true AND is_featured = true;
  END IF;
END $$;

-- ========================================
-- Verification
-- ========================================

DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Test get_top_categories_stats
  RAISE NOTICE 'Testing get_top_categories_stats...';
  PERFORM * FROM get_top_categories_stats(5) LIMIT 1;

  -- Test get_top_cities_stats
  RAISE NOTICE 'Testing get_top_cities_stats...';
  PERFORM * FROM get_top_cities_stats(5) LIMIT 1;

  -- Test get_featured_collections
  RAISE NOTICE 'Testing get_featured_collections...';
  PERFORM * FROM get_featured_collections(6) LIMIT 1;

  RAISE NOTICE '✓ All RPC functions created and tested successfully!';
  RAISE NOTICE 'Note: get_trending_categories requires a city_id parameter and cannot be tested here.';
  RAISE NOTICE 'All functions have fallback queries in the frontend code for resilience.';
END $$;

-- ========================================
-- Summary
-- ========================================
/*
This migration ensures the following RPC functions exist:

1. get_top_categories_stats(limit_count INT)
   - Returns top categories by revenue with listing counts
   - Fallback: useAnalytics.tsx > fetchTopCategoriesFallback()

2. get_top_cities_stats(limit_count INT)
   - Returns top cities by revenue with user and listing counts
   - Fallback: useAnalytics.tsx > fetchTopCitiesAdminFallback()

3. get_trending_categories(p_city_id UUID, p_limit INT)
   - Returns trending categories for a specific city with detailed stats
   - Fallback: CategoryTrends.tsx > fetchTrendingCategoriesFallback()

4. get_featured_collections(collection_limit INTEGER)
   - Returns featured collections with creator information
   - Fallback: FeaturedCollections.tsx > fetchFeaturedCollectionsFallback()

All functions:
- Are idempotent (can be run multiple times)
- Have appropriate indexes for performance
- Have fallback queries in the frontend for resilience
- Are granted to both anon and authenticated users
- Are marked as STABLE for query optimization

If any RPC function fails (404, function not found), the frontend will
automatically use fallback queries to ensure the application continues
to function without errors.
*/
