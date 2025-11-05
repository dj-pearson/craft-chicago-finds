-- SEO Management System: Advanced SEO Features
-- Migration 4 of 6: Crawling, images, links, redirects, and duplicate content

-- SEO Crawl Results - Site crawling data
CREATE TABLE IF NOT EXISTS public.seo_crawl_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crawl_session_id UUID NOT NULL,
  start_url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  parent_url TEXT,
  depth INTEGER DEFAULT 0,

  -- Page information
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  canonical_url TEXT,
  robots_meta TEXT,
  status_code INTEGER,
  content_type TEXT,

  -- Page metrics
  word_count INTEGER,
  load_time_ms INTEGER,
  page_size_bytes INTEGER,

  -- Link counts
  internal_links_count INTEGER DEFAULT 0,
  external_links_count INTEGER DEFAULT 0,
  broken_links_count INTEGER DEFAULT 0,

  -- Issues found
  has_title BOOLEAN DEFAULT false,
  has_description BOOLEAN DEFAULT false,
  has_h1 BOOLEAN DEFAULT false,
  has_canonical BOOLEAN DEFAULT false,
  is_indexable BOOLEAN DEFAULT true,
  has_schema BOOLEAN DEFAULT false,

  -- Crawl metadata
  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_crawl_results_session ON public.seo_crawl_results(crawl_session_id);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_results_url ON public.seo_crawl_results(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_crawl_results_status ON public.seo_crawl_results(status_code);

-- SEO Image Analysis - Image optimization tracking
CREATE TABLE IF NOT EXISTS public.seo_image_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  image_url TEXT NOT NULL,

  -- Image attributes
  alt_text TEXT,
  title_text TEXT,
  file_name TEXT,
  file_extension TEXT,

  -- Image metrics
  width INTEGER,
  height INTEGER,
  file_size_kb DECIMAL(10,2),
  format TEXT,

  -- Optimization status
  has_alt_text BOOLEAN DEFAULT false,
  is_optimized BOOLEAN DEFAULT false,
  is_lazy_loaded BOOLEAN DEFAULT false,
  is_responsive BOOLEAN DEFAULT false,
  uses_modern_format BOOLEAN DEFAULT false, -- WebP, AVIF

  -- Recommendations
  recommended_width INTEGER,
  recommended_height INTEGER,
  recommended_format TEXT,
  potential_savings_kb DECIMAL(10,2),

  -- Issues
  issues JSONB DEFAULT '[]'::jsonb,

  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_url, image_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_image_analysis_page ON public.seo_image_analysis(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_image_analysis_optimized ON public.seo_image_analysis(is_optimized);

-- SEO Redirect Analysis - Redirect chain detection
CREATE TABLE IF NOT EXISTS public.seo_redirect_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  redirect_chain JSONB DEFAULT '[]'::jsonb, -- Array of URLs in chain
  redirect_type TEXT, -- 301, 302, 307, 308, meta, javascript
  chain_length INTEGER DEFAULT 1,
  total_time_ms INTEGER,

  -- Status
  has_redirect_chain BOOLEAN DEFAULT false, -- More than 1 redirect
  is_permanent BOOLEAN DEFAULT false, -- 301 or 308
  is_valid BOOLEAN DEFAULT true,

  -- Issues
  issues JSONB DEFAULT '[]'::jsonb,

  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_redirect_analysis_source ON public.seo_redirect_analysis(source_url);
CREATE INDEX IF NOT EXISTS idx_seo_redirect_analysis_chain ON public.seo_redirect_analysis(has_redirect_chain);

-- SEO Duplicate Content - Duplicate content detection
CREATE TABLE IF NOT EXISTS public.seo_duplicate_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_1 TEXT NOT NULL,
  url_2 TEXT NOT NULL,

  -- Similarity metrics
  content_similarity_percentage DECIMAL(5,2),
  title_similarity_percentage DECIMAL(5,2),
  meta_description_similarity_percentage DECIMAL(5,2),

  -- Content hashes for comparison
  content_hash TEXT,
  title_hash TEXT,

  -- Duplicate type
  duplicate_type TEXT CHECK (duplicate_type IN (
    'exact', 'near_duplicate', 'similar_content', 'same_title', 'same_meta'
  )),

  -- Canonical preference
  preferred_url TEXT,
  canonical_status TEXT CHECK (canonical_status IN ('missing', 'self_referencing', 'pointing_to_duplicate', 'correct')),

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolution_action TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,

  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_duplicate_content_urls ON public.seo_duplicate_content(url_1, url_2);
CREATE INDEX IF NOT EXISTS idx_seo_duplicate_content_resolved ON public.seo_duplicate_content(is_resolved);

-- SEO Security Analysis - Security headers and SSL
CREATE TABLE IF NOT EXISTS public.seo_security_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,

  -- SSL/HTTPS
  has_https BOOLEAN DEFAULT false,
  ssl_valid BOOLEAN DEFAULT false,
  ssl_expiry_date DATE,
  ssl_issuer TEXT,

  -- Security headers
  has_hsts BOOLEAN DEFAULT false,
  has_csp BOOLEAN DEFAULT false,
  has_x_frame_options BOOLEAN DEFAULT false,
  has_x_content_type_options BOOLEAN DEFAULT false,
  has_referrer_policy BOOLEAN DEFAULT false,

  -- Security score
  security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),

  -- Headers data
  security_headers JSONB DEFAULT '{}'::jsonb,

  -- Issues
  issues JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,

  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_security_analysis_url ON public.seo_security_analysis(url);
CREATE INDEX IF NOT EXISTS idx_seo_security_analysis_score ON public.seo_security_analysis(security_score);

-- SEO Link Analysis - Internal and external link tracking
CREATE TABLE IF NOT EXISTS public.seo_link_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT CHECK (link_type IN ('internal', 'external', 'outbound')),
  rel_attribute TEXT, -- nofollow, ugc, sponsored, etc.
  is_broken BOOLEAN DEFAULT false,
  status_code INTEGER,
  link_position TEXT, -- header, content, footer, sidebar
  is_followed BOOLEAN DEFAULT true,

  -- Link value
  anchor_text_quality_score INTEGER CHECK (anchor_text_quality_score >= 0 AND anchor_text_quality_score <= 100),
  link_context TEXT, -- Surrounding text for context

  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_link_analysis_source ON public.seo_link_analysis(source_url);
CREATE INDEX IF NOT EXISTS idx_seo_link_analysis_target ON public.seo_link_analysis(target_url);
CREATE INDEX IF NOT EXISTS idx_seo_link_analysis_broken ON public.seo_link_analysis(is_broken);

-- SEO Structured Data - Schema.org validation
CREATE TABLE IF NOT EXISTS public.seo_structured_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  schema_type TEXT NOT NULL, -- Product, Article, LocalBusiness, etc.
  schema_data JSONB NOT NULL,

  -- Validation
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  validation_warnings JSONB DEFAULT '[]'::jsonb,

  -- Rich snippet eligibility
  eligible_for_rich_snippets BOOLEAN DEFAULT false,
  rich_snippet_types TEXT[] DEFAULT '{}',

  last_validated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_structured_data_url ON public.seo_structured_data(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_structured_data_type ON public.seo_structured_data(schema_type);

-- SEO Mobile Analysis - Mobile-first indexing checks
CREATE TABLE IF NOT EXISTS public.seo_mobile_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL UNIQUE,

  -- Mobile-friendliness
  is_mobile_friendly BOOLEAN DEFAULT false,
  viewport_configured BOOLEAN DEFAULT false,
  text_readable BOOLEAN DEFAULT false,
  tap_targets_sized BOOLEAN DEFAULT false,
  no_horizontal_scrolling BOOLEAN DEFAULT false,

  -- Mobile performance
  mobile_page_speed_score INTEGER CHECK (mobile_page_speed_score >= 0 AND mobile_page_speed_score <= 100),
  mobile_lcp DECIMAL(10,2),
  mobile_fid DECIMAL(10,2),
  mobile_cls DECIMAL(5,3),

  -- Mobile issues
  mobile_issues JSONB DEFAULT '[]'::jsonb,
  mobile_warnings JSONB DEFAULT '[]'::jsonb,

  -- Google Mobile-Friendly Test results
  google_mobile_friendly_test_passed BOOLEAN DEFAULT false,

  last_tested TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_mobile_analysis_url ON public.seo_mobile_analysis(page_url);

-- SEO Performance Budget - Performance budget tracking
CREATE TABLE IF NOT EXISTS public.seo_performance_budget (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_name TEXT NOT NULL,
  page_pattern TEXT NOT NULL, -- URL pattern or regex

  -- Budget limits
  max_page_size_kb INTEGER,
  max_requests INTEGER,
  max_load_time_ms INTEGER,
  max_lcp_ms INTEGER,
  max_fid_ms INTEGER,
  max_cls DECIMAL(5,3),
  max_ttfb_ms INTEGER,

  -- Resource limits
  max_js_size_kb INTEGER,
  max_css_size_kb INTEGER,
  max_image_size_kb INTEGER,
  max_font_size_kb INTEGER,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.seo_crawl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_redirect_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_duplicate_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_security_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_link_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_structured_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_mobile_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_performance_budget ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admin full access to seo_crawl_results" ON public.seo_crawl_results FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_image_analysis" ON public.seo_image_analysis FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_redirect_analysis" ON public.seo_redirect_analysis FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_duplicate_content" ON public.seo_duplicate_content FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_security_analysis" ON public.seo_security_analysis FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_link_analysis" ON public.seo_link_analysis FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_structured_data" ON public.seo_structured_data FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_mobile_analysis" ON public.seo_mobile_analysis FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_performance_budget" ON public.seo_performance_budget FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
