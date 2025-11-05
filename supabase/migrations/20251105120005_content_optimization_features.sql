-- SEO Management System: Content Optimization Features
-- Migration 6 of 6: AI-powered content optimization and semantic analysis

-- SEO Content Optimization - Content analysis and recommendations
CREATE TABLE IF NOT EXISTS public.seo_content_optimization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  target_keyword TEXT,

  -- Content analysis
  word_count INTEGER,
  paragraph_count INTEGER,
  sentence_count INTEGER,
  avg_sentence_length DECIMAL(5,2),

  -- Readability metrics
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
  flesch_reading_ease DECIMAL(5,2),
  flesch_kincaid_grade DECIMAL(5,2),

  -- Keyword analysis
  keyword_density DECIMAL(5,2),
  keyword_count INTEGER,
  keyword_in_title BOOLEAN DEFAULT false,
  keyword_in_h1 BOOLEAN DEFAULT false,
  keyword_in_first_paragraph BOOLEAN DEFAULT false,
  keyword_in_url BOOLEAN DEFAULT false,
  keyword_in_meta_description BOOLEAN DEFAULT false,

  -- LSI (Latent Semantic Indexing) keywords
  lsi_keywords TEXT[] DEFAULT '{}',
  lsi_keyword_coverage INTEGER CHECK (lsi_keyword_coverage >= 0 AND lsi_keyword_coverage <= 100),

  -- Content structure
  has_h1 BOOLEAN DEFAULT false,
  has_h2 BOOLEAN DEFAULT false,
  heading_structure_score INTEGER CHECK (heading_structure_score >= 0 AND heading_structure_score <= 100),
  has_bullet_points BOOLEAN DEFAULT false,
  has_numbered_lists BOOLEAN DEFAULT false,
  has_images BOOLEAN DEFAULT false,
  images_with_alt_text INTEGER DEFAULT 0,

  -- Content quality
  content_quality_score INTEGER CHECK (content_quality_score >= 0 AND content_quality_score <= 100),
  uniqueness_score INTEGER CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),

  -- AI-powered analysis
  ai_content_score INTEGER CHECK (ai_content_score >= 0 AND ai_content_score <= 100),
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  content_gaps JSONB DEFAULT '[]'::jsonb,
  recommended_topics TEXT[] DEFAULT '{}',

  -- Optimization recommendations
  recommendations JSONB DEFAULT '[]'::jsonb,
  priority_fixes JSONB DEFAULT '[]'::jsonb,

  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_content_optimization_url ON public.seo_content_optimization(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_content_optimization_score ON public.seo_content_optimization(content_quality_score DESC);

-- SEO Semantic Analysis - Topic modeling and semantic relevance
CREATE TABLE IF NOT EXISTS public.seo_semantic_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  target_topic TEXT NOT NULL,

  -- Semantic relevance
  topic_relevance_score INTEGER CHECK (topic_relevance_score >= 0 AND topic_relevance_score <= 100),
  semantic_coverage_score INTEGER CHECK (semantic_coverage_score >= 0 AND semantic_coverage_score <= 100),

  -- Topic clusters
  primary_topics JSONB DEFAULT '[]'::jsonb,
  secondary_topics JSONB DEFAULT '[]'::jsonb,
  related_entities JSONB DEFAULT '[]'::jsonb,

  -- Semantic keywords
  semantic_keywords JSONB DEFAULT '[]'::jsonb, -- {keyword: string, relevance: number}[]
  missing_semantic_keywords TEXT[] DEFAULT '{}',
  keyword_clusters JSONB DEFAULT '[]'::jsonb,

  -- NLP analysis
  named_entities JSONB DEFAULT '[]'::jsonb,
  sentiment_score DECIMAL(5,2),
  tone TEXT, -- professional, casual, technical, etc.

  -- Content depth
  content_depth_score INTEGER CHECK (content_depth_score >= 0 AND content_depth_score <= 100),
  topic_comprehensiveness INTEGER CHECK (topic_comprehensiveness >= 0 AND topic_comprehensiveness <= 100),

  -- Recommendations
  suggested_subtopics TEXT[] DEFAULT '{}',
  suggested_entities TEXT[] DEFAULT '{}',

  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_semantic_analysis_url ON public.seo_semantic_analysis(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_semantic_analysis_topic ON public.seo_semantic_analysis(target_topic);

-- SEO Content Templates - Templates for content creation
CREATE TABLE IF NOT EXISTS public.seo_content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN (
    'product_page', 'category_page', 'blog_post', 'landing_page',
    'how_to_guide', 'comparison', 'listicle', 'local_page'
  )),

  -- Template structure
  sections JSONB NOT NULL, -- Array of section definitions
  recommended_word_count INTEGER,
  required_elements TEXT[] DEFAULT '{}',

  -- SEO requirements
  required_keywords TEXT[] DEFAULT '{}',
  required_headings TEXT[] DEFAULT '{}',
  recommended_schema_types TEXT[] DEFAULT '{}',

  -- Content guidelines
  tone TEXT DEFAULT 'professional',
  target_audience TEXT,
  content_goals TEXT[] DEFAULT '{}',

  -- AI prompt template
  ai_prompt_template TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SEO Content Generation History - Track AI-generated content
CREATE TABLE IF NOT EXISTS public.seo_content_generation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.seo_content_templates(id) ON DELETE SET NULL,

  -- Generation parameters
  target_keyword TEXT NOT NULL,
  target_url TEXT,
  content_type TEXT NOT NULL,

  -- Generated content
  generated_title TEXT,
  generated_meta_description TEXT,
  generated_content TEXT,
  generated_h1 TEXT,
  generated_h2_tags TEXT[] DEFAULT '{}',

  -- AI model info
  ai_model TEXT, -- gpt-4, claude-3, etc.
  ai_prompt TEXT,
  ai_temperature DECIMAL(3,2),

  -- Quality metrics
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  ai_confidence_score DECIMAL(5,2),

  -- Usage tracking
  was_used BOOLEAN DEFAULT false,
  published_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,

  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_content_generation_history_keyword ON public.seo_content_generation_history(target_keyword);
CREATE INDEX IF NOT EXISTS idx_seo_content_generation_history_created_at ON public.seo_content_generation_history(created_at DESC);

-- SEO Content Performance - Track content performance metrics
CREATE TABLE IF NOT EXISTS public.seo_content_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Traffic metrics
  organic_sessions INTEGER DEFAULT 0,
  organic_users INTEGER DEFAULT 0,
  organic_pageviews INTEGER DEFAULT 0,
  avg_session_duration INTEGER,
  bounce_rate DECIMAL(5,2),

  -- Engagement metrics
  scroll_depth DECIMAL(5,2),
  time_on_page INTEGER,
  social_shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,

  -- Conversion metrics
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  goal_completions INTEGER DEFAULT 0,

  -- SEO metrics
  avg_position DECIMAL(5,2),
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),

  -- Content changes
  content_updated BOOLEAN DEFAULT false,
  seo_score_change INTEGER,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_url, date)
);

CREATE INDEX IF NOT EXISTS idx_seo_content_performance_url ON public.seo_content_performance(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_content_performance_date ON public.seo_content_performance(date DESC);

-- SEO Title Generator Results - A/B test different titles
CREATE TABLE IF NOT EXISTS public.seo_title_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  variant_title TEXT NOT NULL,
  variant_description TEXT,

  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),

  -- AI generation
  ai_generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,

  -- Testing
  is_active BOOLEAN DEFAULT true,
  is_winner BOOLEAN DEFAULT false,
  test_start_date DATE,
  test_end_date DATE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_title_variants_url ON public.seo_title_variants(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_title_variants_active ON public.seo_title_variants(is_active);

-- Enable Row Level Security
ALTER TABLE public.seo_content_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_semantic_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_title_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admin full access to seo_content_optimization" ON public.seo_content_optimization FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_semantic_analysis" ON public.seo_semantic_analysis FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_content_templates" ON public.seo_content_templates FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_content_generation_history" ON public.seo_content_generation_history FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_content_performance" ON public.seo_content_performance FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_title_variants" ON public.seo_title_variants FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Function to calculate overall content score
CREATE OR REPLACE FUNCTION calculate_content_score(
  p_readability_score INTEGER,
  p_keyword_optimization INTEGER,
  p_structure_score INTEGER,
  p_uniqueness_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  weighted_score DECIMAL(5,2);
BEGIN
  weighted_score := (
    (p_readability_score * 0.25) +
    (p_keyword_optimization * 0.30) +
    (p_structure_score * 0.25) +
    (p_uniqueness_score * 0.20)
  );

  RETURN ROUND(weighted_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Insert default content templates
INSERT INTO public.seo_content_templates (template_name, template_type, recommended_word_count, required_elements) VALUES
  ('Product Page Template', 'product_page', 500, ARRAY['product_description', 'features', 'specifications', 'reviews']),
  ('Blog Post Template', 'blog_post', 1500, ARRAY['introduction', 'main_content', 'conclusion', 'cta']),
  ('How-To Guide Template', 'how_to_guide', 2000, ARRAY['introduction', 'materials_needed', 'step_by_step', 'tips', 'conclusion']),
  ('Comparison Template', 'comparison', 1800, ARRAY['introduction', 'comparison_table', 'detailed_analysis', 'verdict']),
  ('Local Landing Page Template', 'local_page', 800, ARRAY['local_intro', 'local_businesses', 'location_info', 'cta'])
ON CONFLICT DO NOTHING;

-- View: SEO Dashboard Summary
CREATE OR REPLACE VIEW seo_dashboard_summary AS
SELECT
  -- Keyword metrics
  (SELECT COUNT(*) FROM seo_keywords WHERE status = 'active') as active_keywords,
  (SELECT COUNT(*) FROM seo_keywords WHERE current_position <= 3) as top_3_keywords,
  (SELECT COUNT(*) FROM seo_keywords WHERE current_position <= 10) as top_10_keywords,

  -- Audit metrics
  (SELECT overall_score FROM seo_audit_history ORDER BY created_at DESC LIMIT 1) as latest_audit_score,
  (SELECT COUNT(*) FROM seo_audit_history WHERE created_at > NOW() - INTERVAL '7 days') as audits_this_week,

  -- Issue metrics
  (SELECT COUNT(*) FROM seo_alerts WHERE status = 'active') as active_alerts,
  (SELECT COUNT(*) FROM seo_alerts WHERE severity = 'critical' AND status = 'active') as critical_alerts,

  -- Backlink metrics
  (SELECT COUNT(*) FROM seo_backlinks WHERE status = 'active') as active_backlinks,
  (SELECT COUNT(*) FROM seo_backlinks WHERE status = 'new') as new_backlinks,
  (SELECT COUNT(*) FROM seo_backlinks WHERE status = 'lost') as lost_backlinks,

  -- Page metrics
  (SELECT AVG(seo_score) FROM seo_page_scores) as avg_page_score,
  (SELECT COUNT(*) FROM seo_page_scores WHERE seo_score < 70) as pages_needing_improvement;
