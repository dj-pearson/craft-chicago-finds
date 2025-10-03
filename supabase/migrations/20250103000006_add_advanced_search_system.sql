-- Advanced Search & Discovery System
-- Supports semantic search, AI recommendations, and search analytics

-- Table for search analytics and query tracking
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id TEXT NOT NULL UNIQUE,
  query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  search_time INTEGER NOT NULL DEFAULT 0, -- milliseconds
  filters JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for search click analytics
CREATE TABLE IF NOT EXISTS public.search_click_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id TEXT NOT NULL,
  result_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (query_id) REFERENCES public.search_analytics(query_id) ON DELETE CASCADE
);

-- Table for user interactions (views, clicks, purchases, favorites)
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'favorite', 'purchase', 'cart_add', 'share')),
  session_id TEXT,
  context TEXT, -- 'search', 'recommendation', 'browse', 'direct'
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for recommendation analytics
CREATE TABLE IF NOT EXISTS public.recommendation_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  context TEXT NOT NULL, -- 'homepage', 'product_page', 'search_results', 'cart', 'checkout'
  recommended_items TEXT[] NOT NULL DEFAULT '{}',
  clicked_items TEXT[] DEFAULT '{}',
  purchased_items TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user preferences (learned from behavior)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  categories TEXT[] DEFAULT '{}',
  price_range_min DECIMAL(10,2) DEFAULT 0,
  price_range_max DECIMAL(10,2) DEFAULT 1000,
  styles TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  materials TEXT[] DEFAULT '{}',
  favorite_sellers TEXT[] DEFAULT '{}',
  preferred_cities TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for item similarity scores (precomputed)
CREATE TABLE IF NOT EXISTS public.item_similarities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_a_id UUID NOT NULL,
  item_b_id UUID NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  similarity_type TEXT NOT NULL DEFAULT 'content' CHECK (similarity_type IN ('content', 'collaborative', 'behavioral')),
  last_computed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_a_id, item_b_id, similarity_type)
);

-- Table for trending items tracking
CREATE TABLE IF NOT EXISTS public.trending_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  trend_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  time_period TEXT NOT NULL DEFAULT '24h' CHECK (time_period IN ('1h', '24h', '7d', '30d')),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, time_period)
);

-- Table for search suggestions and autocomplete
CREATE TABLE IF NOT EXISTS public.search_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_text TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('query', 'category', 'tag', 'seller', 'brand')),
  popularity_score INTEGER NOT NULL DEFAULT 0,
  search_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(suggestion_text, suggestion_type)
);

-- Table for A/B testing search algorithms
CREATE TABLE IF NOT EXISTS public.search_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_name TEXT NOT NULL,
  algorithm_version TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_shown TEXT[] NOT NULL DEFAULT '{}',
  results_clicked TEXT[] DEFAULT '{}',
  conversion_items TEXT[] DEFAULT '{}',
  experiment_group TEXT NOT NULL, -- 'control', 'variant_a', 'variant_b', etc.
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for visual search data (for future image search)
CREATE TABLE IF NOT EXISTS public.visual_search_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_features JSONB, -- Store image feature vectors
  dominant_colors TEXT[] DEFAULT '{}',
  detected_objects TEXT[] DEFAULT '{}',
  style_tags TEXT[] DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, image_url)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON public.search_analytics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_analytics_timestamp ON public.search_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session_id ON public.search_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_search_click_analytics_query_id ON public.search_click_analytics(query_id);
CREATE INDEX IF NOT EXISTS idx_search_click_analytics_result_id ON public.search_click_analytics(result_id);
CREATE INDEX IF NOT EXISTS idx_search_click_analytics_timestamp ON public.search_click_analytics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_listing_id ON public.user_interactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON public.user_interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON public.user_interactions(session_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_user_id ON public.recommendation_analytics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_session_id ON public.recommendation_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_context ON public.recommendation_analytics(context);
CREATE INDEX IF NOT EXISTS idx_recommendation_analytics_timestamp ON public.recommendation_analytics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_categories ON public.user_preferences USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_user_preferences_last_updated ON public.user_preferences(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_item_similarities_item_a ON public.item_similarities(item_a_id);
CREATE INDEX IF NOT EXISTS idx_item_similarities_item_b ON public.item_similarities(item_b_id);
CREATE INDEX IF NOT EXISTS idx_item_similarities_score ON public.item_similarities(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_item_similarities_type ON public.item_similarities(similarity_type);

CREATE INDEX IF NOT EXISTS idx_trending_items_listing_id ON public.trending_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_trending_items_score ON public.trending_items(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_items_period ON public.trending_items(time_period);
CREATE INDEX IF NOT EXISTS idx_trending_items_calculated_at ON public.trending_items(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_suggestions_text ON public.search_suggestions(suggestion_text);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_type ON public.search_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_popularity ON public.search_suggestions(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_active ON public.search_suggestions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_search_experiments_experiment ON public.search_experiments(experiment_name);
CREATE INDEX IF NOT EXISTS idx_search_experiments_user_id ON public.search_experiments(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_experiments_group ON public.search_experiments(experiment_group);
CREATE INDEX IF NOT EXISTS idx_search_experiments_timestamp ON public.search_experiments(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_visual_search_data_listing_id ON public.visual_search_data(listing_id);
CREATE INDEX IF NOT EXISTS idx_visual_search_data_colors ON public.visual_search_data USING GIN(dominant_colors);
CREATE INDEX IF NOT EXISTS idx_visual_search_data_objects ON public.visual_search_data USING GIN(detected_objects);

-- Row Level Security (RLS) Policies
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_click_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_search_data ENABLE ROW LEVEL SECURITY;

-- Policies for search analytics
CREATE POLICY "Users can view their own search analytics" ON public.search_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert search analytics" ON public.search_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all search analytics" ON public.search_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for search click analytics
CREATE POLICY "System can manage search click analytics" ON public.search_click_analytics
  FOR ALL USING (true);

CREATE POLICY "Admins can view search click analytics" ON public.search_click_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for user interactions
CREATE POLICY "Users can manage their own interactions" ON public.user_interactions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can insert user interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all user interactions" ON public.user_interactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for recommendation analytics
CREATE POLICY "Users can view their own recommendation analytics" ON public.recommendation_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage recommendation analytics" ON public.recommendation_analytics
  FOR ALL USING (true);

CREATE POLICY "Admins can view all recommendation analytics" ON public.recommendation_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for user preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "System can manage user preferences" ON public.user_preferences
  FOR ALL USING (true);

-- Policies for item similarities (read-only for users)
CREATE POLICY "Users can view item similarities" ON public.item_similarities
  FOR SELECT USING (true);

CREATE POLICY "System can manage item similarities" ON public.item_similarities
  FOR ALL USING (true);

-- Policies for trending items (read-only for users)
CREATE POLICY "Users can view trending items" ON public.trending_items
  FOR SELECT USING (true);

CREATE POLICY "System can manage trending items" ON public.trending_items
  FOR ALL USING (true);

-- Policies for search suggestions (read-only for users)
CREATE POLICY "Users can view search suggestions" ON public.search_suggestions
  FOR SELECT USING (is_active = true);

CREATE POLICY "System can manage search suggestions" ON public.search_suggestions
  FOR ALL USING (true);

-- Policies for search experiments
CREATE POLICY "Users can view their own search experiments" ON public.search_experiments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage search experiments" ON public.search_experiments
  FOR ALL USING (true);

-- Policies for visual search data (read-only for users)
CREATE POLICY "Users can view visual search data" ON public.visual_search_data
  FOR SELECT USING (true);

CREATE POLICY "System can manage visual search data" ON public.visual_search_data
  FOR ALL USING (true);

-- Functions for search and recommendation analytics

-- Function to update trending items
CREATE OR REPLACE FUNCTION update_trending_items(time_period_param TEXT DEFAULT '24h')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
  start_time TIMESTAMP WITH TIME ZONE;
  interaction_weight RECORD;
BEGIN
  -- Calculate start time based on period
  CASE time_period_param
    WHEN '1h' THEN start_time := now() - interval '1 hour';
    WHEN '24h' THEN start_time := now() - interval '24 hours';
    WHEN '7d' THEN start_time := now() - interval '7 days';
    WHEN '30d' THEN start_time := now() - interval '30 days';
    ELSE start_time := now() - interval '24 hours';
  END CASE;

  -- Update trending items based on interactions
  INSERT INTO trending_items (
    listing_id,
    trend_score,
    interaction_count,
    view_count,
    purchase_count,
    time_period,
    calculated_at
  )
  SELECT 
    ui.listing_id,
    -- Calculate trend score with weighted interactions
    (COUNT(*) * 1.0 + 
     COUNT(*) FILTER (WHERE ui.interaction_type = 'purchase') * 10.0 +
     COUNT(*) FILTER (WHERE ui.interaction_type = 'favorite') * 5.0 +
     COUNT(*) FILTER (WHERE ui.interaction_type = 'cart_add') * 3.0) as trend_score,
    COUNT(*) as interaction_count,
    COUNT(*) FILTER (WHERE ui.interaction_type = 'view') as view_count,
    COUNT(*) FILTER (WHERE ui.interaction_type = 'purchase') as purchase_count,
    time_period_param,
    now()
  FROM user_interactions ui
  WHERE ui.timestamp >= start_time
  GROUP BY ui.listing_id
  HAVING COUNT(*) > 0
  ON CONFLICT (listing_id, time_period) 
  DO UPDATE SET
    trend_score = EXCLUDED.trend_score,
    interaction_count = EXCLUDED.interaction_count,
    view_count = EXCLUDED.view_count,
    purchase_count = EXCLUDED.purchase_count,
    calculated_at = EXCLUDED.calculated_at;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to update user preferences based on behavior
CREATE OR REPLACE FUNCTION update_user_preferences(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_categories TEXT[];
  user_price_min DECIMAL(10,2);
  user_price_max DECIMAL(10,2);
  user_styles TEXT[];
  user_colors TEXT[];
  user_materials TEXT[];
BEGIN
  -- Get user's favorite categories from interactions
  SELECT ARRAY_AGG(DISTINCT l.category ORDER BY COUNT(*) DESC)
  INTO user_categories
  FROM user_interactions ui
  JOIN listings l ON ui.listing_id = l.id
  WHERE ui.user_id = target_user_id
    AND ui.interaction_type IN ('view', 'favorite', 'purchase')
    AND ui.timestamp > now() - interval '90 days'
  GROUP BY l.category
  LIMIT 5;

  -- Get user's price range preferences
  SELECT 
    PERCENTILE_CONT(0.1) WITHIN GROUP (ORDER BY l.price),
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY l.price)
  INTO user_price_min, user_price_max
  FROM user_interactions ui
  JOIN listings l ON ui.listing_id = l.id
  WHERE ui.user_id = target_user_id
    AND ui.interaction_type IN ('view', 'favorite', 'purchase')
    AND ui.timestamp > now() - interval '90 days';

  -- Get style preferences from tags
  SELECT ARRAY_AGG(DISTINCT tag ORDER BY COUNT(*) DESC)
  INTO user_styles
  FROM user_interactions ui
  JOIN listings l ON ui.listing_id = l.id,
  UNNEST(l.tags) AS tag
  WHERE ui.user_id = target_user_id
    AND ui.interaction_type IN ('view', 'favorite', 'purchase')
    AND ui.timestamp > now() - interval '90 days'
    AND tag IN ('vintage', 'modern', 'rustic', 'minimalist', 'bohemian', 'industrial', 'traditional')
  GROUP BY tag
  LIMIT 3;

  -- Get color preferences from tags
  SELECT ARRAY_AGG(DISTINCT tag ORDER BY COUNT(*) DESC)
  INTO user_colors
  FROM user_interactions ui
  JOIN listings l ON ui.listing_id = l.id,
  UNNEST(l.tags) AS tag
  WHERE ui.user_id = target_user_id
    AND ui.interaction_type IN ('view', 'favorite', 'purchase')
    AND ui.timestamp > now() - interval '90 days'
    AND tag IN ('red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink', 'purple', 'orange')
  GROUP BY tag
  LIMIT 3;

  -- Get material preferences from tags
  SELECT ARRAY_AGG(DISTINCT tag ORDER BY COUNT(*) DESC)
  INTO user_materials
  FROM user_interactions ui
  JOIN listings l ON ui.listing_id = l.id,
  UNNEST(l.tags) AS tag
  WHERE ui.user_id = target_user_id
    AND ui.interaction_type IN ('view', 'favorite', 'purchase')
    AND ui.timestamp > now() - interval '90 days'
    AND tag IN ('wood', 'metal', 'ceramic', 'glass', 'fabric', 'leather', 'plastic', 'stone')
  GROUP BY tag
  LIMIT 3;

  -- Insert or update user preferences
  INSERT INTO user_preferences (
    user_id,
    categories,
    price_range_min,
    price_range_max,
    styles,
    colors,
    materials,
    last_updated
  ) VALUES (
    target_user_id,
    COALESCE(user_categories, '{}'),
    COALESCE(user_price_min, 0),
    COALESCE(user_price_max, 1000),
    COALESCE(user_styles, '{}'),
    COALESCE(user_colors, '{}'),
    COALESCE(user_materials, '{}'),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    categories = EXCLUDED.categories,
    price_range_min = EXCLUDED.price_range_min,
    price_range_max = EXCLUDED.price_range_max,
    styles = EXCLUDED.styles,
    colors = EXCLUDED.colors,
    materials = EXCLUDED.materials,
    last_updated = EXCLUDED.last_updated;

  RETURN true;
END;
$$;

-- Function to get search performance metrics
CREATE OR REPLACE FUNCTION get_search_performance_metrics(
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() - interval '24 hours',
  end_time TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE(
  total_searches INTEGER,
  unique_users INTEGER,
  avg_results_count DECIMAL(10,2),
  avg_search_time DECIMAL(10,2),
  click_through_rate DECIMAL(5,2),
  top_queries TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH search_stats AS (
    SELECT 
      COUNT(*) as total_searches,
      COUNT(DISTINCT user_id) as unique_users,
      AVG(results_count)::DECIMAL(10,2) as avg_results_count,
      AVG(search_time)::DECIMAL(10,2) as avg_search_time
    FROM search_analytics
    WHERE timestamp BETWEEN start_time AND end_time
  ),
  click_stats AS (
    SELECT COUNT(DISTINCT sa.query_id) as clicked_searches
    FROM search_analytics sa
    JOIN search_click_analytics sca ON sa.query_id = sca.query_id
    WHERE sa.timestamp BETWEEN start_time AND end_time
  ),
  top_query_stats AS (
    SELECT ARRAY_AGG(query ORDER BY search_count DESC) as top_queries
    FROM (
      SELECT query, COUNT(*) as search_count
      FROM search_analytics
      WHERE timestamp BETWEEN start_time AND end_time
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT 10
    ) t
  )
  SELECT 
    ss.total_searches,
    ss.unique_users,
    ss.avg_results_count,
    ss.avg_search_time,
    CASE 
      WHEN ss.total_searches > 0 THEN (cs.clicked_searches::DECIMAL / ss.total_searches * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as click_through_rate,
    COALESCE(tqs.top_queries, '{}') as top_queries
  FROM search_stats ss
  CROSS JOIN click_stats cs
  CROSS JOIN top_query_stats tqs;
END;
$$;

-- Function to cleanup old search data
CREATE OR REPLACE FUNCTION cleanup_search_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean up old search analytics (keep last 90 days)
  DELETE FROM search_analytics 
  WHERE timestamp < now() - interval '90 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old user interactions (keep last 180 days)
  DELETE FROM user_interactions 
  WHERE timestamp < now() - interval '180 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old trending items (keep last 30 days)
  DELETE FROM trending_items 
  WHERE calculated_at < now() - interval '30 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old search experiments (keep last 60 days)
  DELETE FROM search_experiments 
  WHERE timestamp < now() - interval '60 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_search_suggestions_updated_at ON public.search_suggestions;
CREATE TRIGGER update_search_suggestions_updated_at
  BEFORE UPDATE ON public.search_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
