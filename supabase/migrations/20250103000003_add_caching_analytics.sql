-- Advanced Caching Strategy Analytics Tables
-- Supports intelligent cache management and performance optimization

-- Table for cache analytics and performance tracking
CREATE TABLE IF NOT EXISTS public.cache_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  namespace TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('hit', 'miss', 'write', 'eviction', 'invalidation')),
  response_time INTEGER, -- milliseconds
  cache_size INTEGER, -- bytes
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for cache configuration and management
CREATE TABLE IF NOT EXISTS public.cache_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  namespace TEXT NOT NULL UNIQUE,
  ttl_seconds INTEGER NOT NULL DEFAULT 300,
  max_size_bytes BIGINT NOT NULL DEFAULT 52428800, -- 50MB default
  eviction_strategy TEXT NOT NULL DEFAULT 'lru' CHECK (eviction_strategy IN ('lru', 'lfu', 'fifo')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_invalidation_patterns TEXT[] DEFAULT '{}',
  performance_threshold_ms INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for cache performance metrics aggregation
CREATE TABLE IF NOT EXISTS public.cache_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  namespace TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  cache_misses INTEGER NOT NULL DEFAULT 0,
  hit_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_response_time DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cache_size BIGINT NOT NULL DEFAULT 0,
  eviction_count INTEGER NOT NULL DEFAULT 0,
  invalidation_count INTEGER NOT NULL DEFAULT 0,
  performance_score INTEGER NOT NULL DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_cache_analytics_namespace ON public.cache_analytics(namespace);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_timestamp ON public.cache_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_access_type ON public.cache_analytics(access_type);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_user_id ON public.cache_analytics(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cache_configurations_namespace ON public.cache_configurations(namespace);
CREATE INDEX IF NOT EXISTS idx_cache_configurations_active ON public.cache_configurations(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_cache_performance_metrics_namespace ON public.cache_performance_metrics(namespace);
CREATE INDEX IF NOT EXISTS idx_cache_performance_metrics_period ON public.cache_performance_metrics(period_start, period_end);

-- Row Level Security (RLS) Policies
ALTER TABLE public.cache_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can view cache analytics
CREATE POLICY "Admins can view cache analytics" ON public.cache_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- System can insert cache analytics
CREATE POLICY "System can insert cache analytics" ON public.cache_analytics
  FOR INSERT WITH CHECK (true);

-- Only admins can manage cache configurations
CREATE POLICY "Admins can manage cache configurations" ON public.cache_configurations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Only admins can view cache performance metrics
CREATE POLICY "Admins can view cache performance metrics" ON public.cache_performance_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- System can insert cache performance metrics
CREATE POLICY "System can insert cache performance metrics" ON public.cache_performance_metrics
  FOR INSERT WITH CHECK (true);

-- Functions for cache management and analytics

-- Function to calculate cache performance metrics
CREATE OR REPLACE FUNCTION calculate_cache_performance_metrics(
  target_namespace TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  total_requests INTEGER,
  cache_hits INTEGER,
  cache_misses INTEGER,
  hit_rate DECIMAL(5,2),
  avg_response_time DECIMAL(10,2),
  eviction_count INTEGER,
  invalidation_count INTEGER,
  performance_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_reqs INTEGER := 0;
  hits INTEGER := 0;
  misses INTEGER := 0;
  evictions INTEGER := 0;
  invalidations INTEGER := 0;
  avg_resp_time DECIMAL(10,2) := 0;
  hit_rate_calc DECIMAL(5,2) := 0;
  perf_score INTEGER := 0;
BEGIN
  -- Count total requests, hits, and misses
  SELECT 
    COUNT(*) FILTER (WHERE access_type IN ('hit', 'miss')),
    COUNT(*) FILTER (WHERE access_type = 'hit'),
    COUNT(*) FILTER (WHERE access_type = 'miss'),
    COUNT(*) FILTER (WHERE access_type = 'eviction'),
    COUNT(*) FILTER (WHERE access_type = 'invalidation'),
    COALESCE(AVG(response_time) FILTER (WHERE response_time IS NOT NULL), 0)
  INTO total_reqs, hits, misses, evictions, invalidations, avg_resp_time
  FROM cache_analytics
  WHERE namespace = target_namespace
    AND timestamp BETWEEN start_time AND end_time;

  -- Calculate hit rate
  IF total_reqs > 0 THEN
    hit_rate_calc := (hits::DECIMAL / total_reqs) * 100;
  END IF;

  -- Calculate performance score (0-100)
  perf_score := 0;
  
  -- Hit rate contributes 60% of score
  perf_score := perf_score + (hit_rate_calc * 0.6)::INTEGER;
  
  -- Response time contributes 30% of score (lower is better)
  IF avg_resp_time <= 50 THEN
    perf_score := perf_score + 30;
  ELSIF avg_resp_time <= 100 THEN
    perf_score := perf_score + 20;
  ELSIF avg_resp_time <= 200 THEN
    perf_score := perf_score + 10;
  END IF;
  
  -- Low eviction rate contributes 10% of score
  IF total_reqs > 0 AND (evictions::DECIMAL / total_reqs) < 0.1 THEN
    perf_score := perf_score + 10;
  ELSIF total_reqs > 0 AND (evictions::DECIMAL / total_reqs) < 0.2 THEN
    perf_score := perf_score + 5;
  END IF;

  RETURN QUERY SELECT
    total_reqs,
    hits,
    misses,
    hit_rate_calc,
    avg_resp_time,
    evictions,
    invalidations,
    LEAST(100, perf_score);
END;
$$;

-- Function to optimize cache configuration based on performance
CREATE OR REPLACE FUNCTION optimize_cache_configuration(target_namespace TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_config RECORD;
  performance_data RECORD;
  recommendations JSONB := '[]'::jsonb;
  recommendation JSONB;
BEGIN
  -- Get current configuration
  SELECT * INTO current_config
  FROM cache_configurations
  WHERE namespace = target_namespace;

  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Get recent performance data (last 24 hours)
  SELECT * INTO performance_data
  FROM calculate_cache_performance_metrics(
    target_namespace,
    now() - interval '24 hours',
    now()
  );

  -- Generate recommendations based on performance
  
  -- Low hit rate recommendation
  IF performance_data.hit_rate < 70 THEN
    recommendation := jsonb_build_object(
      'type', 'ttl_adjustment',
      'current_ttl', current_config.ttl_seconds,
      'recommended_ttl', current_config.ttl_seconds * 2,
      'reason', 'Low hit rate (' || performance_data.hit_rate || '%) suggests TTL is too short',
      'priority', 'high'
    );
    recommendations := recommendations || jsonb_build_array(recommendation);
  END IF;

  -- High eviction rate recommendation
  IF performance_data.total_requests > 0 AND 
     (performance_data.eviction_count::DECIMAL / performance_data.total_requests) > 0.2 THEN
    recommendation := jsonb_build_object(
      'type', 'size_increase',
      'current_size', current_config.max_size_bytes,
      'recommended_size', current_config.max_size_bytes * 1.5,
      'reason', 'High eviction rate suggests cache size is too small',
      'priority', 'medium'
    );
    recommendations := recommendations || jsonb_build_array(recommendation);
  END IF;

  -- Slow response time recommendation
  IF performance_data.avg_response_time > 200 THEN
    recommendation := jsonb_build_object(
      'type', 'strategy_change',
      'current_strategy', current_config.eviction_strategy,
      'recommended_strategy', CASE 
        WHEN current_config.eviction_strategy = 'fifo' THEN 'lru'
        WHEN current_config.eviction_strategy = 'lru' THEN 'lfu'
        ELSE 'lru'
      END,
      'reason', 'Slow average response time (' || performance_data.avg_response_time || 'ms) suggests strategy optimization needed',
      'priority', 'medium'
    );
    recommendations := recommendations || jsonb_build_array(recommendation);
  END IF;

  RETURN recommendations;
END;
$$;

-- Function to auto-aggregate cache performance metrics
CREATE OR REPLACE FUNCTION aggregate_cache_performance_metrics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  namespace_record RECORD;
  aggregated_count INTEGER := 0;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
  perf_data RECORD;
BEGIN
  -- Aggregate metrics for the last hour for each namespace
  end_time := date_trunc('hour', now());
  start_time := end_time - interval '1 hour';

  -- Process each active namespace
  FOR namespace_record IN 
    SELECT DISTINCT namespace 
    FROM cache_configurations 
    WHERE is_active = true
  LOOP
    -- Check if metrics already exist for this period
    IF NOT EXISTS (
      SELECT 1 FROM cache_performance_metrics
      WHERE namespace = namespace_record.namespace
        AND period_start = start_time
        AND period_end = end_time
    ) THEN
      -- Calculate performance metrics
      SELECT * INTO perf_data
      FROM calculate_cache_performance_metrics(
        namespace_record.namespace,
        start_time,
        end_time
      );

      -- Insert aggregated metrics
      INSERT INTO cache_performance_metrics (
        namespace,
        period_start,
        period_end,
        total_requests,
        cache_hits,
        cache_misses,
        hit_rate,
        avg_response_time,
        eviction_count,
        invalidation_count,
        performance_score
      ) VALUES (
        namespace_record.namespace,
        start_time,
        end_time,
        perf_data.total_requests,
        perf_data.cache_hits,
        perf_data.cache_misses,
        perf_data.hit_rate,
        perf_data.avg_response_time,
        perf_data.eviction_count,
        perf_data.invalidation_count,
        perf_data.performance_score
      );

      aggregated_count := aggregated_count + 1;
    END IF;
  END LOOP;

  RETURN aggregated_count;
END;
$$;

-- Insert default cache configurations
INSERT INTO public.cache_configurations (
  namespace,
  ttl_seconds,
  max_size_bytes,
  eviction_strategy,
  auto_invalidation_patterns,
  performance_threshold_ms
) VALUES
('listings', 300, 52428800, 'lru', ARRAY['listing_update', 'listing_delete'], 100),
('profiles', 600, 10485760, 'lru', ARRAY['profile_update'], 150),
('categories', 3600, 5242880, 'lfu', ARRAY['category_update'], 50),
('search', 180, 20971520, 'lru', ARRAY['listing_update', 'listing_delete'], 200),
('analytics', 900, 15728640, 'lfu', ARRAY['analytics_update'], 300)
ON CONFLICT (namespace) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
