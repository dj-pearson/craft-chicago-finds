-- Enhanced Performance Monitoring System Tables
-- Supports real-time alerts, uptime SLA monitoring, and comprehensive system health tracking

-- Table for storing system health check results
CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_time INTEGER, -- milliseconds
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for performance alerts and notifications
CREATE TABLE IF NOT EXISTS public.performance_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('critical', 'warning', 'info')),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for detailed error logging
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for uptime incidents tracking
CREATE TABLE IF NOT EXISTS public.uptime_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  affected_components TEXT[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  root_cause TEXT,
  resolution_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for SLA tracking and reporting
CREATE TABLE IF NOT EXISTS public.sla_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  uptime_percentage DECIMAL(5,2) NOT NULL,
  downtime_minutes INTEGER NOT NULL DEFAULT 0,
  incident_count INTEGER NOT NULL DEFAULT 0,
  mttr_minutes DECIMAL(10,2), -- Mean Time To Recovery
  sla_target DECIMAL(5,2) NOT NULL DEFAULT 99.9,
  sla_met BOOLEAN NOT NULL DEFAULT true,
  total_checks INTEGER NOT NULL DEFAULT 0,
  successful_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for performance optimization recommendations
CREATE TABLE IF NOT EXISTS public.performance_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('caching', 'database', 'frontend', 'api', 'infrastructure')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_estimate TEXT, -- e.g., "Reduce load time by 30%"
  implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  metric_improvement JSONB, -- Expected metric improvements
  implementation_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for API endpoint monitoring
CREATE TABLE IF NOT EXISTS public.api_endpoint_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  response_time INTEGER NOT NULL, -- milliseconds
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON public.system_health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON public.system_health_checks(status);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON public.performance_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON public.performance_alerts(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_performance_alerts_type ON public.performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_metric ON public.performance_alerts(metric_name);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_uptime_incidents_started_at ON public.uptime_incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_incidents_status ON public.uptime_incidents(status);
CREATE INDEX IF NOT EXISTS idx_uptime_incidents_severity ON public.uptime_incidents(severity);

CREATE INDEX IF NOT EXISTS idx_sla_metrics_period ON public.sla_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sla_metrics_uptime ON public.sla_metrics(uptime_percentage);

CREATE INDEX IF NOT EXISTS idx_performance_recommendations_status ON public.performance_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_performance_recommendations_priority ON public.performance_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_performance_recommendations_type ON public.performance_recommendations(recommendation_type);

CREATE INDEX IF NOT EXISTS idx_api_endpoint_metrics_created_at ON public.api_endpoint_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_endpoint_metrics_endpoint ON public.api_endpoint_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_endpoint_metrics_success ON public.api_endpoint_metrics(success);
CREATE INDEX IF NOT EXISTS idx_api_endpoint_metrics_response_time ON public.api_endpoint_metrics(response_time);

-- Row Level Security (RLS) Policies
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoint_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can view all performance data
CREATE POLICY "Admins can view all system health checks" ON public.system_health_checks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert health checks" ON public.system_health_checks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all performance alerts" ON public.performance_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can manage performance alerts" ON public.performance_alerts
  FOR ALL WITH CHECK (true);

-- Users can view their own error logs, admins can view all
CREATE POLICY "Users can view own error logs" ON public.error_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update error logs" ON public.error_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Only admins can manage uptime incidents
CREATE POLICY "Admins can manage uptime incidents" ON public.uptime_incidents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Only admins can view SLA metrics
CREATE POLICY "Admins can view SLA metrics" ON public.sla_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert SLA metrics" ON public.sla_metrics
  FOR INSERT WITH CHECK (true);

-- Admins can manage performance recommendations
CREATE POLICY "Admins can manage performance recommendations" ON public.performance_recommendations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- API metrics - users can view their own, admins can view all
CREATE POLICY "Users can view own API metrics" ON public.api_endpoint_metrics
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert API metrics" ON public.api_endpoint_metrics
  FOR INSERT WITH CHECK (true);

-- Functions for automated performance monitoring

-- Function to calculate SLA metrics for a given period
CREATE OR REPLACE FUNCTION calculate_sla_metrics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  uptime_percentage DECIMAL(5,2),
  downtime_minutes INTEGER,
  incident_count INTEGER,
  mttr_minutes DECIMAL(10,2),
  total_checks INTEGER,
  successful_checks INTEGER,
  failed_checks INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_health_checks INTEGER;
  healthy_checks INTEGER;
  downtime_mins INTEGER := 0;
  incidents INTEGER;
  total_recovery_time INTEGER := 0;
  resolved_incidents INTEGER := 0;
  mttr DECIMAL(10,2) := 0;
BEGIN
  -- Count total health checks in period
  SELECT COUNT(*) INTO total_health_checks
  FROM system_health_checks
  WHERE created_at BETWEEN start_date AND end_date;

  -- Count healthy checks
  SELECT COUNT(*) INTO healthy_checks
  FROM system_health_checks
  WHERE created_at BETWEEN start_date AND end_date
    AND status = 'healthy';

  -- Calculate downtime from incidents
  SELECT 
    COUNT(*),
    COALESCE(SUM(duration_minutes), 0)
  INTO incidents, downtime_mins
  FROM uptime_incidents
  WHERE started_at BETWEEN start_date AND end_date;

  -- Calculate MTTR from resolved incidents
  SELECT 
    COUNT(*),
    COALESCE(SUM(EXTRACT(EPOCH FROM (resolved_at - started_at)) / 60), 0)
  INTO resolved_incidents, total_recovery_time
  FROM uptime_incidents
  WHERE started_at BETWEEN start_date AND end_date
    AND resolved_at IS NOT NULL;

  IF resolved_incidents > 0 THEN
    mttr := total_recovery_time / resolved_incidents;
  END IF;

  RETURN QUERY SELECT
    CASE 
      WHEN total_health_checks > 0 THEN (healthy_checks::DECIMAL / total_health_checks * 100)::DECIMAL(5,2)
      ELSE 100.00::DECIMAL(5,2)
    END,
    downtime_mins,
    incidents,
    mttr,
    total_health_checks,
    healthy_checks,
    (total_health_checks - healthy_checks);
END;
$$;

-- Function to auto-resolve old alerts
CREATE OR REPLACE FUNCTION auto_resolve_stale_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_count INTEGER := 0;
BEGIN
  -- Auto-resolve alerts older than 1 hour that haven't been manually resolved
  UPDATE performance_alerts 
  SET 
    resolved = true,
    resolved_at = now(),
    action_taken = 'Auto-resolved: stale alert'
  WHERE 
    resolved = false 
    AND created_at < now() - interval '1 hour'
    AND alert_type != 'critical'; -- Don't auto-resolve critical alerts

  GET DIAGNOSTICS resolved_count = ROW_COUNT;
  
  RETURN resolved_count;
END;
$$;

-- Function to generate performance recommendations based on metrics
CREATE OR REPLACE FUNCTION generate_performance_recommendations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recommendation_count INTEGER := 0;
  avg_response_time DECIMAL;
  error_rate DECIMAL;
  slow_endpoints RECORD;
BEGIN
  -- Check average API response time over last 24 hours
  SELECT AVG(response_time) INTO avg_response_time
  FROM api_endpoint_metrics
  WHERE created_at > now() - interval '24 hours'
    AND success = true;

  -- Generate recommendation for slow API responses
  IF avg_response_time > 1000 THEN
    INSERT INTO performance_recommendations (
      recommendation_type,
      priority,
      title,
      description,
      impact_estimate,
      implementation_effort,
      metric_improvement
    ) VALUES (
      'api',
      'high',
      'Optimize API Response Times',
      'Average API response time is ' || avg_response_time::TEXT || 'ms, which exceeds the 1000ms threshold. Consider implementing caching, database query optimization, or API endpoint optimization.',
      'Reduce API response time by 40-60%',
      'medium',
      '{"response_time": {"current": ' || avg_response_time || ', "target": 500}}'::jsonb
    )
    ON CONFLICT DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;

  -- Check error rate
  SELECT 
    (COUNT(*) FILTER (WHERE success = false)::DECIMAL / COUNT(*) * 100)
  INTO error_rate
  FROM api_endpoint_metrics
  WHERE created_at > now() - interval '24 hours';

  -- Generate recommendation for high error rate
  IF error_rate > 2 THEN
    INSERT INTO performance_recommendations (
      recommendation_type,
      priority,
      title,
      description,
      impact_estimate,
      implementation_effort,
      metric_improvement
    ) VALUES (
      'api',
      'critical',
      'Reduce API Error Rate',
      'API error rate is ' || error_rate::TEXT || '%, which exceeds the 2% threshold. Investigate failing endpoints and implement proper error handling.',
      'Reduce error rate to <1%',
      'high',
      '{"error_rate": {"current": ' || error_rate || ', "target": 1}}'::jsonb
    )
    ON CONFLICT DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END IF;

  -- Check for consistently slow endpoints
  FOR slow_endpoints IN
    SELECT 
      endpoint,
      AVG(response_time) as avg_time,
      COUNT(*) as request_count
    FROM api_endpoint_metrics
    WHERE created_at > now() - interval '24 hours'
      AND success = true
    GROUP BY endpoint
    HAVING AVG(response_time) > 2000 AND COUNT(*) > 10
  LOOP
    INSERT INTO performance_recommendations (
      recommendation_type,
      priority,
      title,
      description,
      impact_estimate,
      implementation_effort,
      metric_improvement
    ) VALUES (
      'api',
      'medium',
      'Optimize Slow Endpoint: ' || slow_endpoints.endpoint,
      'Endpoint ' || slow_endpoints.endpoint || ' has an average response time of ' || slow_endpoints.avg_time::TEXT || 'ms over ' || slow_endpoints.request_count || ' requests. Consider caching, query optimization, or endpoint refactoring.',
      'Reduce endpoint response time by 50%',
      'medium',
      ('{"endpoint": "' || slow_endpoints.endpoint || '", "response_time": {"current": ' || slow_endpoints.avg_time || ', "target": ' || (slow_endpoints.avg_time * 0.5) || '}}')::jsonb
    )
    ON CONFLICT DO NOTHING;
    
    recommendation_count := recommendation_count + 1;
  END LOOP;

  RETURN recommendation_count;
END;
$$;

-- Function to create uptime incident from critical alerts
CREATE OR REPLACE FUNCTION create_incident_from_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create incident for critical alerts affecting core components
  IF NEW.alert_type = 'critical' AND NEW.metric_name IN ('database', 'api', 'frontend') THEN
    INSERT INTO uptime_incidents (
      title,
      description,
      severity,
      affected_components,
      started_at
    ) VALUES (
      'Critical ' || NEW.metric_name || ' Alert',
      NEW.message,
      'critical',
      ARRAY[NEW.metric_name],
      NEW.created_at
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to auto-create incidents from critical alerts
DROP TRIGGER IF EXISTS trigger_create_incident_from_alert ON public.performance_alerts;
CREATE TRIGGER trigger_create_incident_from_alert
  AFTER INSERT ON public.performance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION create_incident_from_alert();

-- Function to update incident duration when resolved
CREATE OR REPLACE FUNCTION update_incident_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate duration when incident is resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.resolved_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at)) / 60;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update incident duration
DROP TRIGGER IF EXISTS trigger_update_incident_duration ON public.uptime_incidents;
CREATE TRIGGER trigger_update_incident_duration
  BEFORE UPDATE ON public.uptime_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_duration();

-- Insert default performance recommendations
INSERT INTO public.performance_recommendations (
  recommendation_type,
  priority,
  title,
  description,
  impact_estimate,
  implementation_effort,
  status
) VALUES
('caching', 'high', 'Implement Redis Caching', 'Add Redis caching layer for frequently accessed data to reduce database load and improve response times.', 'Reduce page load time by 40%', 'medium', 'pending'),
('database', 'medium', 'Add Database Indexes', 'Analyze slow queries and add appropriate indexes to improve database performance.', 'Reduce query time by 60%', 'low', 'pending'),
('frontend', 'medium', 'Optimize Bundle Size', 'Implement code splitting and tree shaking to reduce JavaScript bundle size.', 'Reduce initial load time by 25%', 'medium', 'pending'),
('infrastructure', 'low', 'Enable CDN', 'Implement Content Delivery Network for static assets to improve global performance.', 'Reduce asset load time by 50%', 'low', 'pending')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
