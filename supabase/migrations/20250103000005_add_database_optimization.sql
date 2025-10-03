-- Database Optimization and Performance Monitoring
-- Supports query performance tracking, slow query analysis, and connection monitoring

-- Table for slow query logging and analysis
CREATE TABLE IF NOT EXISTS public.slow_query_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  execution_time INTEGER NOT NULL, -- milliseconds
  rows_affected INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connection_id TEXT,
  database_name TEXT DEFAULT 'main',
  query_plan JSONB,
  table_scans INTEGER DEFAULT 0,
  index_scans INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for query performance metrics aggregation
CREATE TABLE IF NOT EXISTS public.query_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  query_pattern TEXT NOT NULL, -- Normalized query pattern
  total_executions INTEGER NOT NULL DEFAULT 0,
  total_execution_time INTEGER NOT NULL DEFAULT 0, -- milliseconds
  avg_execution_time DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_execution_time INTEGER NOT NULL DEFAULT 0,
  max_execution_time INTEGER NOT NULL DEFAULT 0,
  p95_execution_time INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  rows_examined INTEGER NOT NULL DEFAULT 0,
  rows_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for database connection pool metrics
CREATE TABLE IF NOT EXISTS public.connection_pool_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_connections INTEGER NOT NULL DEFAULT 0,
  active_connections INTEGER NOT NULL DEFAULT 0,
  idle_connections INTEGER NOT NULL DEFAULT 0,
  pending_acquires INTEGER NOT NULL DEFAULT 0,
  acquire_count INTEGER NOT NULL DEFAULT 0,
  release_count INTEGER NOT NULL DEFAULT 0,
  timeout_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  avg_acquire_time DECIMAL(10,2) DEFAULT 0, -- milliseconds
  pool_utilization DECIMAL(5,2) DEFAULT 0, -- percentage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for database health checks
CREATE TABLE IF NOT EXISTS public.database_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time INTEGER NOT NULL, -- milliseconds
  connection_count INTEGER NOT NULL DEFAULT 0,
  active_queries INTEGER DEFAULT 0,
  blocked_queries INTEGER DEFAULT 0,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  disk_usage DECIMAL(5,2) DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for query optimization suggestions
CREATE TABLE IF NOT EXISTS public.query_optimization_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_pattern TEXT NOT NULL,
  original_query TEXT NOT NULL,
  optimized_query TEXT,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('index', 'rewrite', 'limit', 'join', 'other')),
  description TEXT NOT NULL,
  estimated_improvement DECIMAL(5,2) DEFAULT 0, -- percentage
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected', 'testing')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for index usage statistics
CREATE TABLE IF NOT EXISTS public.index_usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  index_name TEXT NOT NULL,
  scans INTEGER NOT NULL DEFAULT 0,
  tuples_read INTEGER NOT NULL DEFAULT 0,
  tuples_fetched INTEGER NOT NULL DEFAULT 0,
  blocks_read INTEGER NOT NULL DEFAULT 0,
  blocks_hit INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_name, index_name)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_slow_query_log_timestamp ON public.slow_query_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_execution_time ON public.slow_query_log(execution_time DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_query_id ON public.slow_query_log(query_id);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_user_id ON public.slow_query_log(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_query_performance_metrics_time_bucket ON public.query_performance_metrics(time_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_metrics_pattern ON public.query_performance_metrics(query_pattern);
CREATE INDEX IF NOT EXISTS idx_query_performance_metrics_avg_time ON public.query_performance_metrics(avg_execution_time DESC);

CREATE INDEX IF NOT EXISTS idx_connection_pool_metrics_timestamp ON public.connection_pool_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_connection_pool_metrics_utilization ON public.connection_pool_metrics(pool_utilization DESC);

CREATE INDEX IF NOT EXISTS idx_database_health_checks_timestamp ON public.database_health_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_database_health_checks_status ON public.database_health_checks(status);

CREATE INDEX IF NOT EXISTS idx_query_optimization_suggestions_priority ON public.query_optimization_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_query_optimization_suggestions_status ON public.query_optimization_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_query_optimization_suggestions_pattern ON public.query_optimization_suggestions(query_pattern);

CREATE INDEX IF NOT EXISTS idx_index_usage_stats_table_name ON public.index_usage_stats(table_name);
CREATE INDEX IF NOT EXISTS idx_index_usage_stats_scans ON public.index_usage_stats(scans DESC);
CREATE INDEX IF NOT EXISTS idx_index_usage_stats_last_used ON public.index_usage_stats(last_used DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE public.slow_query_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_pool_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.index_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policies for slow query log (admin and system access)
CREATE POLICY "Admins can view slow query log" ON public.slow_query_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert slow query log" ON public.slow_query_log
  FOR INSERT WITH CHECK (true);

-- Policies for query performance metrics (admin only)
CREATE POLICY "Admins can view query performance metrics" ON public.query_performance_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can manage query performance metrics" ON public.query_performance_metrics
  FOR ALL USING (true);

-- Policies for connection pool metrics (admin only)
CREATE POLICY "Admins can view connection pool metrics" ON public.connection_pool_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert connection pool metrics" ON public.connection_pool_metrics
  FOR INSERT WITH CHECK (true);

-- Policies for database health checks (admin only)
CREATE POLICY "Admins can view database health checks" ON public.database_health_checks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert database health checks" ON public.database_health_checks
  FOR INSERT WITH CHECK (true);

-- Policies for query optimization suggestions (admin only)
CREATE POLICY "Admins can manage query optimization suggestions" ON public.query_optimization_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for index usage stats (admin only)
CREATE POLICY "Admins can view index usage stats" ON public.index_usage_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can manage index usage stats" ON public.index_usage_stats
  FOR ALL USING (true);

-- Functions for database optimization and monitoring

-- Function to normalize query patterns for analysis
CREATE OR REPLACE FUNCTION normalize_query_pattern(query_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Normalize query by removing literals and parameters
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          upper(trim(query_text)),
          '\$[0-9]+', '?', 'g'  -- Replace parameters
        ),
        '''[^'']*''', '''?''', 'g'  -- Replace string literals
      ),
      '\b[0-9]+\b', '?', 'g'  -- Replace numeric literals
    ),
    '\s+', ' ', 'g'  -- Normalize whitespace
  );
END;
$$;

-- Function to aggregate query performance metrics
CREATE OR REPLACE FUNCTION aggregate_query_performance_metrics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aggregated_count INTEGER := 0;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Aggregate metrics for the last hour
  end_time := date_trunc('hour', now());
  start_time := end_time - interval '1 hour';

  -- Insert aggregated metrics for each query pattern
  INSERT INTO query_performance_metrics (
    time_bucket,
    query_pattern,
    total_executions,
    total_execution_time,
    avg_execution_time,
    min_execution_time,
    max_execution_time,
    p95_execution_time,
    success_count,
    error_count,
    rows_examined,
    rows_sent
  )
  SELECT 
    start_time as time_bucket,
    normalize_query_pattern(query_text) as query_pattern,
    COUNT(*) as total_executions,
    SUM(execution_time) as total_execution_time,
    AVG(execution_time)::DECIMAL(10,2) as avg_execution_time,
    MIN(execution_time) as min_execution_time,
    MAX(execution_time) as max_execution_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time)::INTEGER as p95_execution_time,
    COUNT(*) FILTER (WHERE error_message IS NULL) as success_count,
    COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count,
    SUM(rows_affected) as rows_examined,
    SUM(rows_affected) as rows_sent
  FROM slow_query_log
  WHERE timestamp >= start_time AND timestamp < end_time
  GROUP BY normalize_query_pattern(query_text)
  ON CONFLICT (time_bucket, query_pattern) DO UPDATE SET
    total_executions = EXCLUDED.total_executions,
    total_execution_time = EXCLUDED.total_execution_time,
    avg_execution_time = EXCLUDED.avg_execution_time,
    min_execution_time = EXCLUDED.min_execution_time,
    max_execution_time = EXCLUDED.max_execution_time,
    p95_execution_time = EXCLUDED.p95_execution_time,
    success_count = EXCLUDED.success_count,
    error_count = EXCLUDED.error_count,
    rows_examined = EXCLUDED.rows_examined,
    rows_sent = EXCLUDED.rows_sent;

  GET DIAGNOSTICS aggregated_count = ROW_COUNT;
  RETURN aggregated_count;
END;
$$;

-- Function to identify slow queries and generate optimization suggestions
CREATE OR REPLACE FUNCTION analyze_slow_queries(
  threshold_ms INTEGER DEFAULT 1000,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  query_pattern TEXT,
  avg_execution_time DECIMAL(10,2),
  total_executions INTEGER,
  suggestion_type TEXT,
  description TEXT,
  priority TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH slow_patterns AS (
    SELECT 
      qpm.query_pattern,
      qpm.avg_execution_time,
      qpm.total_executions,
      ROW_NUMBER() OVER (ORDER BY qpm.avg_execution_time DESC) as rn
    FROM query_performance_metrics qpm
    WHERE qpm.avg_execution_time > threshold_ms
      AND qpm.time_bucket > now() - interval '24 hours'
  )
  SELECT 
    sp.query_pattern,
    sp.avg_execution_time,
    sp.total_executions,
    CASE 
      WHEN sp.query_pattern LIKE '%SELECT *%' THEN 'rewrite'
      WHEN sp.query_pattern LIKE '%ORDER BY%' AND sp.query_pattern NOT LIKE '%LIMIT%' THEN 'limit'
      WHEN sp.query_pattern LIKE '%WHERE%' AND sp.query_pattern LIKE '%OR%' THEN 'index'
      WHEN sp.avg_execution_time > 5000 THEN 'critical'
      ELSE 'other'
    END as suggestion_type,
    CASE 
      WHEN sp.query_pattern LIKE '%SELECT *%' THEN 'Replace SELECT * with specific column names'
      WHEN sp.query_pattern LIKE '%ORDER BY%' AND sp.query_pattern NOT LIKE '%LIMIT%' THEN 'Add LIMIT clause to ORDER BY queries'
      WHEN sp.query_pattern LIKE '%WHERE%' AND sp.query_pattern LIKE '%OR%' THEN 'Consider adding indexes for OR conditions'
      WHEN sp.avg_execution_time > 5000 THEN 'Query execution time is critical - requires immediate optimization'
      ELSE 'Review query structure for optimization opportunities'
    END as description,
    CASE 
      WHEN sp.avg_execution_time > 5000 THEN 'critical'
      WHEN sp.avg_execution_time > 2000 THEN 'high'
      WHEN sp.avg_execution_time > 1000 THEN 'medium'
      ELSE 'low'
    END as priority
  FROM slow_patterns sp
  WHERE sp.rn <= limit_count;
END;
$$;

-- Function to get database performance summary
CREATE OR REPLACE FUNCTION get_database_performance_summary(
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE(
  metric_name TEXT,
  metric_value DECIMAL(10,2),
  metric_unit TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := now() - (hours_back || ' hours')::interval;

  RETURN QUERY
  SELECT 
    'Average Query Time'::TEXT as metric_name,
    COALESCE(AVG(avg_execution_time), 0)::DECIMAL(10,2) as metric_value,
    'ms'::TEXT as metric_unit,
    CASE 
      WHEN AVG(avg_execution_time) > 1000 THEN 'poor'
      WHEN AVG(avg_execution_time) > 500 THEN 'fair'
      ELSE 'good'
    END::TEXT as status
  FROM query_performance_metrics
  WHERE time_bucket >= start_time

  UNION ALL

  SELECT 
    'Slow Query Count'::TEXT,
    COUNT(*)::DECIMAL(10,2),
    'queries'::TEXT,
    CASE 
      WHEN COUNT(*) > 100 THEN 'poor'
      WHEN COUNT(*) > 50 THEN 'fair'
      ELSE 'good'
    END::TEXT
  FROM slow_query_log
  WHERE timestamp >= start_time

  UNION ALL

  SELECT 
    'Connection Pool Utilization'::TEXT,
    COALESCE(AVG(pool_utilization), 0)::DECIMAL(10,2),
    '%'::TEXT,
    CASE 
      WHEN AVG(pool_utilization) > 90 THEN 'poor'
      WHEN AVG(pool_utilization) > 70 THEN 'fair'
      ELSE 'good'
    END::TEXT
  FROM connection_pool_metrics
  WHERE timestamp >= start_time

  UNION ALL

  SELECT 
    'Database Health Score'::TEXT,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'healthy') = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'healthy')::DECIMAL / COUNT(*) * 100)::DECIMAL(10,2)
    END,
    '%'::TEXT,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'healthy')::DECIMAL / COUNT(*) > 0.95 THEN 'good'
      WHEN COUNT(*) FILTER (WHERE status = 'healthy')::DECIMAL / COUNT(*) > 0.80 THEN 'fair'
      ELSE 'poor'
    END::TEXT
  FROM database_health_checks
  WHERE timestamp >= start_time;
END;
$$;

-- Function to cleanup old performance data
CREATE OR REPLACE FUNCTION cleanup_database_performance_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean up old slow query logs (keep last 30 days)
  DELETE FROM slow_query_log 
  WHERE timestamp < now() - interval '30 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old query performance metrics (keep last 90 days)
  DELETE FROM query_performance_metrics 
  WHERE time_bucket < now() - interval '90 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old connection pool metrics (keep last 7 days)
  DELETE FROM connection_pool_metrics 
  WHERE timestamp < now() - interval '7 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old health checks (keep last 7 days)
  DELETE FROM database_health_checks 
  WHERE timestamp < now() - interval '7 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;

-- Function for executing parameterized queries (placeholder)
CREATE OR REPLACE FUNCTION execute_parameterized_query(
  query_text TEXT,
  query_params JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder function for parameterized query execution
  -- In a real implementation, this would safely execute parameterized queries
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Parameterized query execution not implemented',
    'query', query_text,
    'params', query_params
  );
END;
$$;

-- Function for executing raw queries (placeholder)
CREATE OR REPLACE FUNCTION execute_raw_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder function for raw query execution
  -- In a real implementation, this would safely execute raw SQL
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Raw query execution not implemented',
    'query', query_text
  );
END;
$$;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply update triggers to relevant tables
DROP TRIGGER IF EXISTS update_query_optimization_suggestions_updated_at ON public.query_optimization_suggestions;
CREATE TRIGGER update_query_optimization_suggestions_updated_at
  BEFORE UPDATE ON public.query_optimization_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_index_usage_stats_updated_at ON public.index_usage_stats;
CREATE TRIGGER update_index_usage_stats_updated_at
  BEFORE UPDATE ON public.index_usage_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
