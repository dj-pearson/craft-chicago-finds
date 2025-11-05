-- SEO Management System: Core Tables
-- Migration 1 of 6: Foundation tables for SEO management

-- Global SEO Settings
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  site_name TEXT NOT NULL,
  default_meta_title TEXT,
  default_meta_description TEXT,
  default_og_image TEXT,
  default_keywords TEXT[] DEFAULT '{}',
  google_analytics_id TEXT,
  google_search_console_verified BOOLEAN DEFAULT false,
  robots_txt_content TEXT,
  sitemap_enabled BOOLEAN DEFAULT true,
  sitemap_last_generated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SEO Audit History - Stores comprehensive audit results
CREATE TABLE IF NOT EXISTS public.seo_audit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  audit_type TEXT NOT NULL DEFAULT 'full' CHECK (audit_type IN ('full', 'quick', 'technical', 'content', 'performance')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Score breakdown
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
  best_practices_score INTEGER CHECK (best_practices_score >= 0 AND best_practices_score <= 100),

  -- Audit results
  issues_found JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  passed_checks JSONB DEFAULT '[]'::jsonb,

  -- Meta data
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  canonical_url TEXT,
  h1_tags TEXT[],
  h2_tags TEXT[],

  -- Performance metrics
  page_load_time_ms INTEGER,
  total_page_size_kb INTEGER,
  total_requests INTEGER,

  -- Status
  audit_status TEXT DEFAULT 'pending' CHECK (audit_status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,

  -- Audit metadata
  audited_by UUID REFERENCES auth.users(id),
  audited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_url ON public.seo_audit_history(url);
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_created_at ON public.seo_audit_history(created_at DESC);

-- SEO Fixes Applied - Track what fixes have been implemented
CREATE TABLE IF NOT EXISTS public.seo_fixes_applied (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES public.seo_audit_history(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  fix_type TEXT NOT NULL CHECK (fix_type IN (
    'meta_title', 'meta_description', 'alt_text', 'heading_structure',
    'internal_links', 'broken_links', 'redirect', 'robots_txt',
    'sitemap', 'schema', 'performance', 'mobile', 'other'
  )),
  fix_description TEXT NOT NULL,
  fix_details JSONB DEFAULT '{}'::jsonb,
  before_value TEXT,
  after_value TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'verified', 'failed', 'reverted')),
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_fixes_url ON public.seo_fixes_applied(url);
CREATE INDEX IF NOT EXISTS idx_seo_fixes_status ON public.seo_fixes_applied(status);

-- SEO Keywords - Keyword tracking and monitoring
CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  target_url TEXT NOT NULL,
  target_position INTEGER,
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER,
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  cpc DECIMAL(10,2),
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword, target_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_status ON public.seo_keywords(status);

-- SEO Keyword History - Track keyword position changes over time
CREATE TABLE IF NOT EXISTS public.seo_keyword_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  position INTEGER,
  search_volume INTEGER,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  avg_position DECIMAL(5,2),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_keyword_id ON public.seo_keyword_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_history_recorded_at ON public.seo_keyword_history(recorded_at DESC);

-- SEO Competitor Analysis
CREATE TABLE IF NOT EXISTS public.seo_competitor_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_name TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  page_authority INTEGER CHECK (page_authority >= 0 AND page_authority <= 100),
  backlinks_count INTEGER,
  referring_domains INTEGER,
  organic_keywords INTEGER,
  organic_traffic_estimate INTEGER,
  top_keywords TEXT[] DEFAULT '{}',
  content_strategy TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  threats JSONB DEFAULT '[]'::jsonb,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(competitor_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_competitor_url ON public.seo_competitor_analysis(competitor_url);

-- SEO Page Scores - Individual page SEO scores
CREATE TABLE IF NOT EXISTS public.seo_page_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  page_title TEXT,
  page_type TEXT CHECK (page_type IN ('homepage', 'product', 'category', 'blog', 'landing', 'other')),
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  content_quality_score INTEGER CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
  keyword_density JSONB DEFAULT '{}'::jsonb,
  word_count INTEGER,
  image_count INTEGER,
  alt_text_coverage INTEGER CHECK (alt_text_coverage >= 0 AND alt_text_coverage <= 100),
  internal_links_count INTEGER,
  external_links_count INTEGER,
  has_schema BOOLEAN DEFAULT false,
  schema_types TEXT[] DEFAULT '{}',
  mobile_friendly BOOLEAN DEFAULT true,
  page_speed_score INTEGER CHECK (page_speed_score >= 0 AND page_speed_score <= 100),
  issues JSONB DEFAULT '[]'::jsonb,
  last_scored TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_page_scores_url ON public.seo_page_scores(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_score ON public.seo_page_scores(seo_score DESC);

-- SEO Monitoring Log - Activity and event tracking
CREATE TABLE IF NOT EXISTS public.seo_monitoring_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'audit_run', 'fix_applied', 'keyword_update', 'position_change',
    'competitor_analyzed', 'alert_triggered', 'report_generated', 'error'
  )),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  related_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_event_type ON public.seo_monitoring_log(event_type);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_created_at ON public.seo_monitoring_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_monitoring_log_severity ON public.seo_monitoring_log(severity);

-- Enable Row Level Security on all tables
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_fixes_applied ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keyword_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_monitoring_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access for SEO management
CREATE POLICY "Admin full access to seo_settings"
  ON public.seo_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_audit_history"
  ON public.seo_audit_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_fixes_applied"
  ON public.seo_fixes_applied
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_keywords"
  ON public.seo_keywords
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_keyword_history"
  ON public.seo_keyword_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_competitor_analysis"
  ON public.seo_competitor_analysis
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_page_scores"
  ON public.seo_page_scores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to seo_monitoring_log"
  ON public.seo_monitoring_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO public.seo_settings (
  site_url,
  site_name,
  default_meta_title,
  default_meta_description,
  sitemap_enabled
) VALUES (
  'https://craftlocal.com',
  'Craft Chicago Finds',
  'Craft Chicago Finds | Discover Local Artisans & Handmade Crafts',
  'Explore unique handmade crafts from local Chicago artisans. Shop pottery, jewelry, art, and more from talented makers in your community.',
  true
) ON CONFLICT DO NOTHING;
