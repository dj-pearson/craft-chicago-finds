-- Fix RLS policies for SEO edge functions
-- Edge functions need to be able to insert/update SEO data

-- Drop existing overly restrictive policies and add proper ones
DROP POLICY IF EXISTS "Admin full access to seo_audit_history" ON public.seo_audit_history;
DROP POLICY IF EXISTS "Admin full access to seo_monitoring_log" ON public.seo_monitoring_log;
DROP POLICY IF EXISTS "Admin full access to seo_crawl_results" ON public.seo_crawl_results;
DROP POLICY IF EXISTS "Admin full access to seo_alerts" ON public.seo_alerts;

-- SEO Audit History: Admins can do everything, service role can insert
CREATE POLICY "Admins can manage seo_audit_history" ON public.seo_audit_history
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role AND is_active = true)
  );

CREATE POLICY "Service role can insert seo_audit_history" ON public.seo_audit_history
  FOR INSERT
  WITH CHECK (true);

-- SEO Monitoring Log: Admins can read, service role can insert
CREATE POLICY "Admins can view seo_monitoring_log" ON public.seo_monitoring_log
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role AND is_active = true)
  );

CREATE POLICY "Service role can insert seo_monitoring_log" ON public.seo_monitoring_log
  FOR INSERT
  WITH CHECK (true);

-- SEO Crawl Results: Admins can manage, service role can insert/update
CREATE POLICY "Admins can manage seo_crawl_results" ON public.seo_crawl_results
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role AND is_active = true)
  );

CREATE POLICY "Service role can manage seo_crawl_results" ON public.seo_crawl_results
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- SEO Alerts: Admins can manage, service role can insert/update
CREATE POLICY "Admins can manage seo_alerts" ON public.seo_alerts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role AND is_active = true)
  );

CREATE POLICY "Service role can manage seo_alerts" ON public.seo_alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also fix other SEO tables that edge functions might need to write to
-- SEO Keywords
DROP POLICY IF EXISTS "Admin full access to seo_keywords" ON public.seo_keywords;
CREATE POLICY "Admins can manage seo_keywords" ON public.seo_keywords
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role AND is_active = true)
  );

CREATE POLICY "Service role can manage seo_keywords" ON public.seo_keywords
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- SEO Page Scores
DROP POLICY IF EXISTS "Admin full access to seo_page_scores" ON public.seo_page_scores;
CREATE POLICY "Admins can manage seo_page_scores" ON public.seo_page_scores
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role AND is_active = true)
  );

CREATE POLICY "Service role can manage seo_page_scores" ON public.seo_page_scores
  FOR ALL
  USING (true)
  WITH CHECK (true);