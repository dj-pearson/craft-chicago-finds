-- Microservices Infrastructure Tables
-- Supports service registry, event bus, and API gateway functionality

-- Table for service registry
CREATE TABLE IF NOT EXISTS public.service_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  health_endpoint TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for service instances
CREATE TABLE IF NOT EXISTS public.service_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id TEXT NOT NULL,
  service_id TEXT NOT NULL REFERENCES public.service_registry(service_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'starting' CHECK (status IN ('healthy', 'unhealthy', 'starting', 'stopping')),
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, instance_id)
);

-- Table for service health checks
CREATE TABLE IF NOT EXISTS public.service_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'degraded')),
  response_time INTEGER NOT NULL, -- milliseconds
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, instance_id) REFERENCES public.service_instances(service_id, instance_id) ON DELETE CASCADE
);

-- Table for event messages (event bus)
CREATE TABLE IF NOT EXISTS public.event_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  target TEXT, -- Optional for broadcast events
  payload JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  correlation_id TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'processed', 'failed', 'retry_scheduled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for event subscriptions
CREATE TABLE IF NOT EXISTS public.event_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id TEXT NOT NULL UNIQUE,
  service_id TEXT NOT NULL REFERENCES public.service_registry(service_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  filter_criteria JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for API routes (API Gateway)
CREATE TABLE IF NOT EXISTS public.api_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  service_id TEXT NOT NULL REFERENCES public.service_registry(service_id) ON DELETE CASCADE,
  target_path TEXT NOT NULL,
  requires_auth BOOLEAN NOT NULL DEFAULT false,
  rate_limit JSONB, -- {requests: number, windowMs: number}
  timeout INTEGER DEFAULT 30000, -- milliseconds
  retries INTEGER DEFAULT 0,
  circuit_breaker JSONB, -- {failureThreshold: number, resetTimeoutMs: number}
  middleware TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(method, path)
);

-- Table for API gateway request logs
CREATE TABLE IF NOT EXISTS public.api_gateway_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  route_id TEXT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  service_id TEXT,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL, -- milliseconds
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Table for service dependencies tracking
CREATE TABLE IF NOT EXISTS public.service_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES public.service_registry(service_id) ON DELETE CASCADE,
  depends_on_service_id TEXT NOT NULL REFERENCES public.service_registry(service_id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'runtime' CHECK (dependency_type IN ('runtime', 'build', 'optional')),
  version_constraint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, depends_on_service_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_service_registry_status ON public.service_registry(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_service_registry_capabilities ON public.service_registry USING GIN(capabilities);

CREATE INDEX IF NOT EXISTS idx_service_instances_service_id ON public.service_instances(service_id);
CREATE INDEX IF NOT EXISTS idx_service_instances_status ON public.service_instances(status);
CREATE INDEX IF NOT EXISTS idx_service_instances_heartbeat ON public.service_instances(last_heartbeat DESC);

CREATE INDEX IF NOT EXISTS idx_service_health_checks_service_instance ON public.service_health_checks(service_id, instance_id);
CREATE INDEX IF NOT EXISTS idx_service_health_checks_timestamp ON public.service_health_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_service_health_checks_status ON public.service_health_checks(status);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_type ON public.event_messages(event_type);
CREATE INDEX IF NOT EXISTS idx_event_messages_source ON public.event_messages(source);
CREATE INDEX IF NOT EXISTS idx_event_messages_target ON public.event_messages(target) WHERE target IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_messages_status ON public.event_messages(status);
CREATE INDEX IF NOT EXISTS idx_event_messages_timestamp ON public.event_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_messages_correlation_id ON public.event_messages(correlation_id) WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_subscriptions_service_id ON public.event_subscriptions(service_id);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_event_type ON public.event_subscriptions(event_type);
CREATE INDEX IF NOT EXISTS idx_event_subscriptions_active ON public.event_subscriptions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_routes_method_path ON public.api_routes(method, path);
CREATE INDEX IF NOT EXISTS idx_api_routes_service_id ON public.api_routes(service_id);
CREATE INDEX IF NOT EXISTS idx_api_routes_active ON public.api_routes(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_gateway_logs_timestamp ON public.api_gateway_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_gateway_logs_route_id ON public.api_gateway_logs(route_id);
CREATE INDEX IF NOT EXISTS idx_api_gateway_logs_service_id ON public.api_gateway_logs(service_id);
CREATE INDEX IF NOT EXISTS idx_api_gateway_logs_status_code ON public.api_gateway_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_gateway_logs_user_id ON public.api_gateway_logs(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_dependencies_service_id ON public.service_dependencies(service_id);
CREATE INDEX IF NOT EXISTS idx_service_dependencies_depends_on ON public.service_dependencies(depends_on_service_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.service_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_gateway_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_dependencies ENABLE ROW LEVEL SECURITY;

-- Policies for service registry (admin only for management, read for services)
CREATE POLICY "Admins can manage service registry" ON public.service_registry
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Services can read service registry" ON public.service_registry
  FOR SELECT USING (true); -- Allow services to discover each other

-- Policies for service instances (services can manage their own instances)
CREATE POLICY "Services can manage their instances" ON public.service_instances
  FOR ALL USING (true); -- Services need to register/update their instances

CREATE POLICY "Admins can view all service instances" ON public.service_instances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for health checks (services can report their health)
CREATE POLICY "Services can report health" ON public.service_health_checks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view health checks" ON public.service_health_checks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for event messages (services can publish/consume events)
CREATE POLICY "Services can manage events" ON public.event_messages
  FOR ALL USING (true); -- Services need to publish and process events

CREATE POLICY "Admins can view all events" ON public.event_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for event subscriptions (services can manage their subscriptions)
CREATE POLICY "Services can manage subscriptions" ON public.event_subscriptions
  FOR ALL USING (true);

CREATE POLICY "Admins can view all subscriptions" ON public.event_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for API routes (admin only)
CREATE POLICY "Admins can manage API routes" ON public.api_routes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies for API gateway logs (admin only for viewing)
CREATE POLICY "Admins can view gateway logs" ON public.api_gateway_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert gateway logs" ON public.api_gateway_logs
  FOR INSERT WITH CHECK (true);

-- Policies for service dependencies (admin and services)
CREATE POLICY "Admins can manage service dependencies" ON public.service_dependencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Services can view dependencies" ON public.service_dependencies
  FOR SELECT USING (true);

-- Functions for microservices management

-- Function to get service health summary
CREATE OR REPLACE FUNCTION get_service_health_summary(target_service_id TEXT DEFAULT NULL)
RETURNS TABLE(
  service_id TEXT,
  service_name TEXT,
  total_instances INTEGER,
  healthy_instances INTEGER,
  unhealthy_instances INTEGER,
  avg_response_time DECIMAL(10,2),
  last_health_check TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.service_id,
    sr.name as service_name,
    COUNT(si.id)::INTEGER as total_instances,
    COUNT(si.id) FILTER (WHERE si.status = 'healthy')::INTEGER as healthy_instances,
    COUNT(si.id) FILTER (WHERE si.status = 'unhealthy')::INTEGER as unhealthy_instances,
    COALESCE(AVG(shc.response_time) FILTER (WHERE shc.timestamp > now() - interval '1 hour'), 0)::DECIMAL(10,2) as avg_response_time,
    MAX(shc.timestamp) as last_health_check
  FROM service_registry sr
  LEFT JOIN service_instances si ON sr.service_id = si.service_id
  LEFT JOIN service_health_checks shc ON si.service_id = shc.service_id AND si.instance_id = shc.instance_id
  WHERE (target_service_id IS NULL OR sr.service_id = target_service_id)
    AND sr.status = 'active'
  GROUP BY sr.service_id, sr.name
  ORDER BY sr.name;
END;
$$;

-- Function to get event processing statistics
CREATE OR REPLACE FUNCTION get_event_processing_stats(
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() - interval '24 hours',
  end_time TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE(
  event_type TEXT,
  total_events INTEGER,
  processed_events INTEGER,
  failed_events INTEGER,
  avg_processing_time DECIMAL(10,2),
  success_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    em.event_type,
    COUNT(*)::INTEGER as total_events,
    COUNT(*) FILTER (WHERE em.status = 'processed')::INTEGER as processed_events,
    COUNT(*) FILTER (WHERE em.status = 'failed')::INTEGER as failed_events,
    COALESCE(AVG(EXTRACT(EPOCH FROM (em.updated_at - em.created_at)) * 1000) FILTER (WHERE em.status = 'processed'), 0)::DECIMAL(10,2) as avg_processing_time,
    CASE 
      WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE em.status = 'processed')::DECIMAL / COUNT(*) * 100)::DECIMAL(5,2)
      ELSE 0::DECIMAL(5,2)
    END as success_rate
  FROM event_messages em
  WHERE em.timestamp BETWEEN start_time AND end_time
  GROUP BY em.event_type
  ORDER BY total_events DESC;
END;
$$;

-- Function to get API gateway performance metrics
CREATE OR REPLACE FUNCTION get_api_gateway_metrics(
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() - interval '24 hours',
  end_time TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE(
  route_path TEXT,
  method TEXT,
  service_id TEXT,
  total_requests INTEGER,
  avg_response_time DECIMAL(10,2),
  error_rate DECIMAL(5,2),
  p95_response_time DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    agl.path,
    agl.method,
    agl.service_id,
    COUNT(*)::INTEGER as total_requests,
    AVG(agl.response_time)::DECIMAL(10,2) as avg_response_time,
    (COUNT(*) FILTER (WHERE agl.status_code >= 400)::DECIMAL / COUNT(*) * 100)::DECIMAL(5,2) as error_rate,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY agl.response_time)::DECIMAL(10,2) as p95_response_time
  FROM api_gateway_logs agl
  WHERE agl.timestamp BETWEEN start_time AND end_time
  GROUP BY agl.path, agl.method, agl.service_id
  ORDER BY total_requests DESC;
END;
$$;

-- Function to cleanup old records
CREATE OR REPLACE FUNCTION cleanup_microservices_data()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Clean up old health checks (keep last 7 days)
  DELETE FROM service_health_checks 
  WHERE timestamp < now() - interval '7 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old processed events (keep last 30 days)
  DELETE FROM event_messages 
  WHERE status = 'processed' 
    AND updated_at < now() - interval '30 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up old API gateway logs (keep last 30 days)
  DELETE FROM api_gateway_logs 
  WHERE timestamp < now() - interval '30 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Clean up inactive service instances (not updated in 1 hour)
  UPDATE service_instances 
  SET status = 'stopping'
  WHERE status IN ('healthy', 'unhealthy') 
    AND last_heartbeat < now() - interval '1 hour';
  
  RETURN deleted_count;
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
DROP TRIGGER IF EXISTS update_service_registry_updated_at ON public.service_registry;
CREATE TRIGGER update_service_registry_updated_at
  BEFORE UPDATE ON public.service_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_instances_updated_at ON public.service_instances;
CREATE TRIGGER update_service_instances_updated_at
  BEFORE UPDATE ON public.service_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_messages_updated_at ON public.event_messages;
CREATE TRIGGER update_event_messages_updated_at
  BEFORE UPDATE ON public.event_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_subscriptions_updated_at ON public.event_subscriptions;
CREATE TRIGGER update_event_subscriptions_updated_at
  BEFORE UPDATE ON public.event_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_routes_updated_at ON public.api_routes;
CREATE TRIGGER update_api_routes_updated_at
  BEFORE UPDATE ON public.api_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default core services
INSERT INTO public.service_registry (
  service_id,
  name,
  version,
  endpoint,
  health_endpoint,
  capabilities,
  dependencies,
  metadata
) VALUES
('core-api', 'Core API Service', '1.0.0', '/api/v1', '/health', 
 ARRAY['listings', 'users', 'orders'], ARRAY['database'], 
 '{"description": "Main API service for core functionality"}'),
('auth-service', 'Authentication Service', '1.0.0', '/auth', '/health',
 ARRAY['authentication', 'authorization'], ARRAY['database'],
 '{"description": "User authentication and authorization"}'),
('notification-service', 'Notification Service', '1.0.0', '/notifications', '/health',
 ARRAY['email', 'sms', 'push'], ARRAY['email-provider', 'sms-provider'],
 '{"description": "Multi-channel notification delivery"}'),
('analytics-service', 'Analytics Service', '1.0.0', '/analytics', '/health',
 ARRAY['tracking', 'reporting', 'metrics'], ARRAY['database', 'cache'],
 '{"description": "User behavior and business analytics"}'),
('search-service', 'Search Service', '1.0.0', '/search', '/health',
 ARRAY['full-text-search', 'filtering', 'recommendations'], ARRAY['elasticsearch'],
 '{"description": "Advanced search and recommendation engine"}')
ON CONFLICT (service_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
