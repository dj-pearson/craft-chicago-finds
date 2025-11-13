-- Smart Recommendations System Migration
-- Created: 2025-11-13
-- Purpose: Create tables and functions for AI-powered product recommendations

-- ============================================================================
-- USER FAVORITES TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Index for fast user favorites lookup
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created
ON user_favorites(user_id, created_at DESC);

-- Index for listing popularity tracking
CREATE INDEX IF NOT EXISTS idx_user_favorites_listing
ON user_favorites(listing_id);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorites"
ON user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
ON user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- LISTING VIEW TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_view_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  session_id text,
  view_duration_seconds integer DEFAULT 0,
  device_type text, -- 'mobile', 'tablet', 'desktop'
  referrer text,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index for user viewing history
CREATE INDEX IF NOT EXISTS idx_listing_view_tracking_user
ON listing_view_tracking(user_id, viewed_at DESC);

-- Index for listing popularity
CREATE INDEX IF NOT EXISTS idx_listing_view_tracking_listing
ON listing_view_tracking(listing_id, viewed_at DESC);

-- Index for session tracking
CREATE INDEX IF NOT EXISTS idx_listing_view_tracking_session
ON listing_view_tracking(session_id, viewed_at DESC);

-- Enable RLS
ALTER TABLE listing_view_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admins and the user can view)
CREATE POLICY "Users can view their own tracking data"
ON listing_view_tracking FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
));

CREATE POLICY "Anyone can track views"
ON listing_view_tracking FOR INSERT
WITH CHECK (true); -- Allow anonymous tracking

-- ============================================================================
-- USER PREFERENCE PROFILE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preference_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  favorite_categories jsonb DEFAULT '[]'::jsonb, -- Array of category IDs with weights
  price_range_min numeric DEFAULT 0,
  price_range_max numeric DEFAULT 1000,
  preferred_cities jsonb DEFAULT '[]'::jsonb, -- Array of city IDs
  style_tags jsonb DEFAULT '[]'::jsonb, -- Array of style preferences
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_preference_profiles_user
ON user_preference_profiles(user_id);

-- Enable RLS
ALTER TABLE user_preference_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
ON user_preference_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON user_preference_profiles FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RECOMMENDATION CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recommendation_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommended_listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  score numeric NOT NULL,
  reason text, -- 'similar_to_favorites', 'popular_in_category', 'trending', etc.
  metadata jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recommended_listing_id)
);

-- Index for fast user recommendations
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_user_score
ON recommendation_cache(user_id, score DESC, expires_at);

-- Index for cleanup of expired recommendations
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires
ON recommendation_cache(expires_at);

-- Enable RLS
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recommendations"
ON recommendation_cache FOR SELECT
USING (auth.uid() = user_id AND expires_at > now());

-- ============================================================================
-- FUNCTION: Track Listing View
-- ============================================================================

CREATE OR REPLACE FUNCTION track_listing_view(
  p_user_id uuid,
  p_listing_id uuid,
  p_session_id text DEFAULT NULL,
  p_duration_seconds integer DEFAULT 0,
  p_device_type text DEFAULT 'desktop',
  p_referrer text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insert view tracking record
  INSERT INTO listing_view_tracking (
    user_id,
    listing_id,
    session_id,
    view_duration_seconds,
    device_type,
    referrer,
    viewed_at
  ) VALUES (
    p_user_id,
    p_listing_id,
    p_session_id,
    p_duration_seconds,
    p_device_type,
    p_referrer,
    now()
  );

  -- Update listing view count (existing function)
  PERFORM increment_listing_views(p_listing_id);

  -- Update user preference profile (async)
  PERFORM update_user_preferences_from_view(p_user_id, p_listing_id);

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail (tracking shouldn't block user experience)
    RAISE WARNING 'Failed to track listing view: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Update User Preferences from View
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_preferences_from_view(
  p_user_id uuid,
  p_listing_id uuid
) RETURNS void AS $$
DECLARE
  v_category_id uuid;
  v_city_id uuid;
  v_price numeric;
BEGIN
  -- Get listing details
  SELECT category_id, city_id, price
  INTO v_category_id, v_city_id, v_price
  FROM listings
  WHERE id = p_listing_id;

  -- Insert or update user preference profile
  INSERT INTO user_preference_profiles (user_id, favorite_categories, preferred_cities)
  VALUES (
    p_user_id,
    jsonb_build_array(jsonb_build_object('id', v_category_id, 'weight', 1)),
    jsonb_build_array(v_city_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    favorite_categories = (
      SELECT jsonb_agg(DISTINCT elem)
      FROM (
        SELECT elem FROM jsonb_array_elements(user_preference_profiles.favorite_categories) elem
        UNION
        SELECT jsonb_build_object('id', v_category_id, 'weight', 1)
      ) t
    ),
    preferred_cities = (
      SELECT jsonb_agg(DISTINCT elem)
      FROM (
        SELECT elem FROM jsonb_array_elements(user_preference_profiles.preferred_cities) elem
        UNION
        SELECT to_jsonb(v_city_id)
      ) t
    ),
    last_updated = now();

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update user preferences: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get Smart Recommendations (Collaborative Filtering)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_smart_recommendations(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
) RETURNS TABLE (
  listing_id uuid,
  score numeric,
  reason text
) AS $$
BEGIN
  -- Check cache first
  RETURN QUERY
  SELECT
    rc.recommended_listing_id,
    rc.score,
    rc.reason
  FROM recommendation_cache rc
  WHERE rc.user_id = p_user_id
    AND rc.expires_at > now()
  ORDER BY rc.score DESC
  LIMIT p_limit
  OFFSET p_offset;

  -- If cache has results, return them
  IF FOUND THEN
    RETURN;
  END IF;

  -- Otherwise, generate fresh recommendations
  RETURN QUERY
  WITH user_favorites AS (
    -- Get user's favorite categories and their weights
    SELECT
      l.category_id,
      COUNT(*) as favorite_count
    FROM user_favorites uf
    JOIN listings l ON l.id = uf.listing_id
    WHERE uf.user_id = p_user_id
    GROUP BY l.category_id
  ),
  user_views AS (
    -- Get recently viewed categories
    SELECT
      l.category_id,
      COUNT(*) as view_count,
      AVG(lvt.view_duration_seconds) as avg_duration
    FROM listing_view_tracking lvt
    JOIN listings l ON l.id = lvt.listing_id
    WHERE lvt.user_id = p_user_id
      AND lvt.viewed_at > now() - interval '30 days'
    GROUP BY l.category_id
  ),
  similar_users AS (
    -- Find users with similar tastes (collaborative filtering)
    SELECT
      uf2.user_id,
      COUNT(*) as similarity_score
    FROM user_favorites uf1
    JOIN user_favorites uf2 ON uf1.listing_id = uf2.listing_id
    WHERE uf1.user_id = p_user_id
      AND uf2.user_id != p_user_id
    GROUP BY uf2.user_id
    ORDER BY similarity_score DESC
    LIMIT 50
  ),
  similar_user_favorites AS (
    -- Get what similar users like
    SELECT
      uf.listing_id,
      SUM(su.similarity_score) as collaborative_score
    FROM similar_users su
    JOIN user_favorites uf ON uf.user_id = su.user_id
    WHERE uf.listing_id NOT IN (
      SELECT listing_id FROM user_favorites WHERE user_id = p_user_id
    )
    GROUP BY uf.listing_id
  )
  SELECT
    l.id as listing_id,
    (
      -- Category match score (40%)
      COALESCE(uf.favorite_count * 10, 0) * 0.4 +
      -- View history score (20%)
      COALESCE(uv.view_count * 5, 0) * 0.2 +
      -- Collaborative filtering score (30%)
      COALESCE(suf.collaborative_score, 0) * 0.3 +
      -- Popularity score (10%)
      (l.view_count / GREATEST(EXTRACT(EPOCH FROM (now() - l.created_at)) / 86400, 1)) * 0.1
    ) as score,
    CASE
      WHEN uf.favorite_count > 0 THEN 'Based on your favorite categories'
      WHEN suf.collaborative_score > 0 THEN 'People with similar taste love this'
      WHEN uv.view_count > 0 THEN 'Similar to items you viewed'
      ELSE 'Trending in your area'
    END as reason
  FROM listings l
  LEFT JOIN user_favorites uf ON uf.category_id = l.category_id
  LEFT JOIN user_views uv ON uv.category_id = l.category_id
  LEFT JOIN similar_user_favorites suf ON suf.listing_id = l.id
  WHERE l.status = 'active'
    AND l.inventory_count > 0
    AND l.id NOT IN (
      SELECT listing_id FROM user_favorites WHERE user_id = p_user_id
    )
    AND l.id NOT IN (
      SELECT listing_id FROM listing_view_tracking
      WHERE user_id = p_user_id
      AND viewed_at > now() - interval '7 days'
    )
  ORDER BY score DESC
  LIMIT p_limit
  OFFSET p_offset;

  -- Cache the results for future queries
  INSERT INTO recommendation_cache (user_id, recommended_listing_id, score, reason)
  SELECT p_user_id, listing_id, score, reason
  FROM get_smart_recommendations
  ON CONFLICT (user_id, recommended_listing_id) DO UPDATE
  SET score = EXCLUDED.score,
      reason = EXCLUDED.reason,
      expires_at = now() + interval '1 hour';

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Cleanup Expired Recommendations
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED JOB: Cleanup expired recommendations (optional)
-- ============================================================================

-- Note: This requires pg_cron extension
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then schedule: SELECT cron.schedule('cleanup-recommendations', '0 * * * *', 'SELECT cleanup_expired_recommendations()');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION track_listing_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_smart_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_recommendations TO postgres;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Smart recommendations system created successfully!';
    RAISE NOTICE 'Use: SELECT * FROM get_smart_recommendations(auth.uid(), 10);';
    RAISE NOTICE 'Track views: SELECT track_listing_view(user_id, listing_id, session_id, duration);';
END $$;
