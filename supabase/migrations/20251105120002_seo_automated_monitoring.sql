-- SEO Management System: Automated Monitoring
-- Migration 3 of 6: Monitoring, alerts, and notification system

-- SEO Notification Preferences - How users want to be notified
CREATE TABLE IF NOT EXISTS public.seo_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  notification_types TEXT[] DEFAULT ARRAY['critical', 'warning']::TEXT[],
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'America/Chicago',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- SEO Alert Rules - Define what triggers alerts
CREATE TABLE IF NOT EXISTS public.seo_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'position_drop', 'position_gain', 'traffic_drop', 'traffic_spike',
    'error_increase', '404_increase', 'broken_links', 'slow_page',
    'low_score', 'new_competitor', 'backlink_lost', 'keyword_opportunity'
  )),
  is_active BOOLEAN DEFAULT true,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),

  -- Threshold configuration
  threshold_value DECIMAL(10,2),
  threshold_operator TEXT CHECK (threshold_operator IN ('greater_than', 'less_than', 'equals', 'not_equals', 'percentage_change')),
  time_window_hours INTEGER DEFAULT 24,

  -- Rule conditions (JSON for flexibility)
  conditions JSONB DEFAULT '{}'::jsonb,

  -- Actions to take
  send_notification BOOLEAN DEFAULT true,
  create_ticket BOOLEAN DEFAULT false,
  auto_fix_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SEO Alerts - Triggered alerts
CREATE TABLE IF NOT EXISTS public.seo_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.seo_alert_rules(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  affected_url TEXT,
  affected_keyword TEXT,

  -- Alert data
  current_value DECIMAL(10,2),
  previous_value DECIMAL(10,2),
  threshold_value DECIMAL(10,2),
  change_percentage DECIMAL(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  -- Notification tracking
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_alerts_status ON public.seo_alerts(status);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_severity ON public.seo_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_seo_alerts_created_at ON public.seo_alerts(created_at DESC);

-- SEO Monitoring Schedules - Automated monitoring jobs
CREATE TABLE IF NOT EXISTS public.seo_monitoring_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_name TEXT NOT NULL,
  monitoring_type TEXT NOT NULL CHECK (monitoring_type IN (
    'full_audit', 'quick_check', 'keyword_tracking', 'competitor_analysis',
    'backlink_check', 'core_web_vitals', 'broken_links', 'security_check'
  )),
  is_active BOOLEAN DEFAULT true,

  -- Schedule configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  cron_expression TEXT, -- Custom cron if needed
  time_of_day TIME DEFAULT '02:00:00',
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),

  -- Target configuration
  target_urls TEXT[] DEFAULT '{}',
  target_keywords TEXT[] DEFAULT '{}',

  -- Execution tracking
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  last_run_duration_seconds INTEGER,
  next_run_at TIMESTAMP WITH TIME ZONE,
  total_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_monitoring_schedules_next_run ON public.seo_monitoring_schedules(next_run_at);

-- SEO Core Web Vitals - Performance monitoring
CREATE TABLE IF NOT EXISTS public.seo_core_web_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  device TEXT DEFAULT 'mobile' CHECK (device IN ('mobile', 'desktop')),

  -- Core Web Vitals metrics
  lcp DECIMAL(10,2), -- Largest Contentful Paint (seconds)
  fid DECIMAL(10,2), -- First Input Delay (milliseconds)
  cls DECIMAL(5,3), -- Cumulative Layout Shift (score)
  fcp DECIMAL(10,2), -- First Contentful Paint (seconds)
  ttfb DECIMAL(10,2), -- Time to First Byte (seconds)
  inp DECIMAL(10,2), -- Interaction to Next Paint (milliseconds)

  -- Overall performance score
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),

  -- Page metrics
  total_blocking_time_ms INTEGER,
  speed_index DECIMAL(10,2),

  -- Assessment
  lcp_rating TEXT CHECK (lcp_rating IN ('good', 'needs-improvement', 'poor')),
  fid_rating TEXT CHECK (fid_rating IN ('good', 'needs-improvement', 'poor')),
  cls_rating TEXT CHECK (cls_rating IN ('good', 'needs-improvement', 'poor')),

  -- Additional data
  opportunities JSONB DEFAULT '[]'::jsonb,
  diagnostics JSONB DEFAULT '[]'::jsonb,

  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_core_web_vitals_url ON public.seo_core_web_vitals(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_core_web_vitals_measured_at ON public.seo_core_web_vitals(measured_at DESC);

-- Enable Row Level Security
ALTER TABLE public.seo_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_core_web_vitals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admin full access to seo_notification_preferences"
  ON public.seo_notification_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_alert_rules"
  ON public.seo_alert_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_alerts"
  ON public.seo_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_monitoring_schedules"
  ON public.seo_monitoring_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_core_web_vitals"
  ON public.seo_core_web_vitals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to calculate next run time for monitoring schedules
CREATE OR REPLACE FUNCTION calculate_next_run_time(schedule_record public.seo_monitoring_schedules)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_run TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE schedule_record.frequency
    WHEN 'hourly' THEN
      next_run := NOW() + INTERVAL '1 hour';
    WHEN 'daily' THEN
      next_run := DATE_TRUNC('day', NOW()) + schedule_record.time_of_day + INTERVAL '1 day';
    WHEN 'weekly' THEN
      next_run := DATE_TRUNC('week', NOW()) + (schedule_record.day_of_week || ' days')::INTERVAL + schedule_record.time_of_day + INTERVAL '1 week';
    WHEN 'monthly' THEN
      next_run := DATE_TRUNC('month', NOW()) + ((schedule_record.day_of_month - 1) || ' days')::INTERVAL + schedule_record.time_of_day + INTERVAL '1 month';
    ELSE
      next_run := NOW() + INTERVAL '1 day';
  END CASE;

  -- If calculated time is in the past, add another interval
  IF next_run < NOW() THEN
    CASE schedule_record.frequency
      WHEN 'hourly' THEN next_run := next_run + INTERVAL '1 hour';
      WHEN 'daily' THEN next_run := next_run + INTERVAL '1 day';
      WHEN 'weekly' THEN next_run := next_run + INTERVAL '1 week';
      WHEN 'monthly' THEN next_run := next_run + INTERVAL '1 month';
    END CASE;
  END IF;

  RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate next run time
CREATE OR REPLACE FUNCTION update_next_run_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run_at := calculate_next_run_time(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_run_time
  BEFORE INSERT OR UPDATE ON public.seo_monitoring_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_run_time();

-- Insert default alert rules
INSERT INTO public.seo_alert_rules (rule_name, rule_type, severity, threshold_value, threshold_operator, send_notification) VALUES
  ('Keyword Position Drop Alert', 'position_drop', 'warning', 5, 'greater_than', true),
  ('Traffic Drop Alert', 'traffic_drop', 'critical', 20, 'percentage_change', true),
  ('404 Error Increase', '404_increase', 'warning', 10, 'greater_than', true),
  ('Page Speed Degradation', 'slow_page', 'warning', 3000, 'greater_than', true),
  ('SEO Score Drop', 'low_score', 'warning', 70, 'less_than', true)
ON CONFLICT DO NOTHING;

-- Insert default monitoring schedule
INSERT INTO public.seo_monitoring_schedules (schedule_name, monitoring_type, frequency, time_of_day, is_active) VALUES
  ('Daily SEO Audit', 'full_audit', 'daily', '02:00:00', true),
  ('Hourly Keyword Check', 'keyword_tracking', 'hourly', NULL, true),
  ('Weekly Competitor Analysis', 'competitor_analysis', 'weekly', '03:00:00', true),
  ('Daily Core Web Vitals', 'core_web_vitals', 'daily', '04:00:00', true)
ON CONFLICT DO NOTHING;
