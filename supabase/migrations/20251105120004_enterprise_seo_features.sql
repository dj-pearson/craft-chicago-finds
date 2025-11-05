-- SEO Management System: Enterprise SEO Features
-- Migration 5 of 6: Backlinks, SERP tracking, and advanced analytics

-- SEO Backlinks - Backlink tracking and analysis
CREATE TABLE IF NOT EXISTS public.seo_backlinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_url TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,

  -- Link attributes
  anchor_text TEXT,
  link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),
  link_position TEXT, -- editorial, footer, sidebar, comment
  is_active BOOLEAN DEFAULT true,

  -- Source metrics
  source_domain_authority INTEGER CHECK (source_domain_authority >= 0 AND source_domain_authority <= 100),
  source_page_authority INTEGER CHECK (source_page_authority >= 0 AND source_page_authority <= 100),
  source_spam_score INTEGER CHECK (source_spam_score >= 0 AND source_spam_score <= 100),

  -- Link value
  link_value_score INTEGER CHECK (link_value_score >= 0 AND link_value_score <= 100),
  estimated_traffic INTEGER,

  -- Backlink status
  first_seen DATE,
  last_seen DATE,
  lost_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost', 'new', 'reclaimed')),

  -- Link context
  surrounding_text TEXT,
  page_title TEXT,

  -- API source
  api_source TEXT, -- ahrefs, moz, semrush, manual
  raw_data JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(target_url, source_url)
);

CREATE INDEX IF NOT EXISTS idx_seo_backlinks_target ON public.seo_backlinks(target_url);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_source_domain ON public.seo_backlinks(source_domain);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_status ON public.seo_backlinks(status);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_last_seen ON public.seo_backlinks(last_seen DESC);

-- SEO SERP Positions - Search engine ranking positions
CREATE TABLE IF NOT EXISTS public.seo_serp_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,
  search_engine TEXT DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo', 'duckduckgo')),
  location TEXT DEFAULT 'United States',
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile')),
  language TEXT DEFAULT 'en',

  -- Position data
  position INTEGER,
  previous_position INTEGER,
  position_change INTEGER,

  -- SERP features
  has_featured_snippet BOOLEAN DEFAULT false,
  has_local_pack BOOLEAN DEFAULT false,
  has_knowledge_panel BOOLEAN DEFAULT false,
  has_people_also_ask BOOLEAN DEFAULT false,
  has_image_pack BOOLEAN DEFAULT false,
  has_video_carousel BOOLEAN DEFAULT false,

  -- SERP metadata
  title TEXT,
  description TEXT,
  display_url TEXT,

  -- Tracking
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword, url, search_engine, location, device, tracked_date)
);

CREATE INDEX IF NOT EXISTS idx_seo_serp_positions_keyword ON public.seo_serp_positions(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_serp_positions_url ON public.seo_serp_positions(url);
CREATE INDEX IF NOT EXISTS idx_seo_serp_positions_date ON public.seo_serp_positions(tracked_date DESC);

-- SEO Backlink Opportunities - Potential backlink sources
CREATE TABLE IF NOT EXISTS public.seo_backlink_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_url TEXT NOT NULL,
  opportunity_domain TEXT NOT NULL,
  opportunity_type TEXT CHECK (opportunity_type IN (
    'competitor_backlink', 'broken_link', 'unlinked_mention',
    'guest_post', 'resource_page', 'directory'
  )),

  -- Opportunity metrics
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  priority_score INTEGER CHECK (priority_score >= 0 AND priority_score <= 100),

  -- Outreach status
  outreach_status TEXT DEFAULT 'identified' CHECK (outreach_status IN (
    'identified', 'researched', 'contacted', 'follow_up', 'accepted',
    'rejected', 'link_acquired', 'not_relevant'
  )),
  outreach_attempts INTEGER DEFAULT 0,
  last_contact_date DATE,
  next_follow_up_date DATE,

  -- Contact information
  contact_email TEXT,
  contact_name TEXT,
  outreach_notes TEXT,

  -- Result
  link_acquired BOOLEAN DEFAULT false,
  link_acquired_date DATE,
  link_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_backlink_opportunities_status ON public.seo_backlink_opportunities(outreach_status);
CREATE INDEX IF NOT EXISTS idx_seo_backlink_opportunities_priority ON public.seo_backlink_opportunities(priority_score DESC);

-- SEO Rank Tracking History - Historical SERP tracking
CREATE TABLE IF NOT EXISTS public.seo_rank_tracking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  url TEXT NOT NULL,

  -- Position tracking
  position INTEGER,
  position_type TEXT CHECK (position_type IN ('organic', 'featured_snippet', 'local_pack', 'not_ranking')),

  -- Changes
  position_change INTEGER,
  position_change_percentage DECIMAL(5,2),

  -- Visibility metrics
  estimated_traffic INTEGER,
  estimated_clicks INTEGER,
  search_visibility_score DECIMAL(5,2),

  -- SERP snapshot
  serp_features JSONB DEFAULT '[]'::jsonb,
  top_10_competitors JSONB DEFAULT '[]'::jsonb,

  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword_id, tracked_date)
);

CREATE INDEX IF NOT EXISTS idx_seo_rank_tracking_history_keyword ON public.seo_rank_tracking_history(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_rank_tracking_history_date ON public.seo_rank_tracking_history(tracked_date DESC);

-- SEO Competitor Keywords - Competitor keyword analysis
CREATE TABLE IF NOT EXISTS public.seo_competitor_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID REFERENCES public.seo_competitor_analysis(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  position INTEGER,
  search_volume INTEGER,
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
  cpc DECIMAL(10,2),
  url TEXT,

  -- Opportunity analysis
  we_rank_for BOOLEAN DEFAULT false,
  our_position INTEGER,
  keyword_gap BOOLEAN DEFAULT false, -- They rank, we don't
  opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),

  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_competitor_keywords_competitor ON public.seo_competitor_keywords(competitor_id);
CREATE INDEX IF NOT EXISTS idx_seo_competitor_keywords_keyword ON public.seo_competitor_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_competitor_keywords_gap ON public.seo_competitor_keywords(keyword_gap);

-- SEO Domain Metrics - Overall domain SEO metrics
CREATE TABLE IF NOT EXISTS public.seo_domain_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Authority metrics
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  page_authority INTEGER CHECK (page_authority >= 0 AND page_authority <= 100),
  trust_flow INTEGER CHECK (trust_flow >= 0 AND trust_flow <= 100),
  citation_flow INTEGER CHECK (citation_flow >= 0 AND citation_flow <= 100),

  -- Backlink metrics
  total_backlinks INTEGER DEFAULT 0,
  unique_domains INTEGER DEFAULT 0,
  dofollow_backlinks INTEGER DEFAULT 0,
  nofollow_backlinks INTEGER DEFAULT 0,
  new_backlinks_30d INTEGER DEFAULT 0,
  lost_backlinks_30d INTEGER DEFAULT 0,

  -- Ranking metrics
  total_ranking_keywords INTEGER DEFAULT 0,
  top_3_rankings INTEGER DEFAULT 0,
  top_10_rankings INTEGER DEFAULT 0,
  top_100_rankings INTEGER DEFAULT 0,

  -- Traffic estimation
  estimated_organic_traffic INTEGER,
  organic_traffic_value DECIMAL(10,2),

  -- Indexed pages
  indexed_pages INTEGER,

  -- API source
  api_source TEXT, -- ahrefs, moz, semrush

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(domain, date)
);

CREATE INDEX IF NOT EXISTS idx_seo_domain_metrics_domain ON public.seo_domain_metrics(domain);
CREATE INDEX IF NOT EXISTS idx_seo_domain_metrics_date ON public.seo_domain_metrics(date DESC);

-- Enable Row Level Security
ALTER TABLE public.seo_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_serp_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_backlink_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_rank_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_competitor_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_domain_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admin full access to seo_backlinks" ON public.seo_backlinks FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_serp_positions" ON public.seo_serp_positions FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_backlink_opportunities" ON public.seo_backlink_opportunities FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_rank_tracking_history" ON public.seo_rank_tracking_history FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_competitor_keywords" ON public.seo_competitor_keywords FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to seo_domain_metrics" ON public.seo_domain_metrics FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Function to calculate keyword opportunity score
CREATE OR REPLACE FUNCTION calculate_keyword_opportunity_score(
  p_search_volume INTEGER,
  p_difficulty INTEGER,
  p_current_position INTEGER,
  p_competitor_position INTEGER
) RETURNS INTEGER AS $$
DECLARE
  volume_score INTEGER;
  difficulty_score INTEGER;
  position_score INTEGER;
  total_score INTEGER;
BEGIN
  -- Higher search volume = higher score (max 40 points)
  volume_score := LEAST(40, (p_search_volume / 1000)::INTEGER);

  -- Lower difficulty = higher score (max 30 points)
  difficulty_score := 30 - (p_difficulty * 30 / 100);

  -- Position gap = opportunity (max 30 points)
  IF p_current_position IS NULL OR p_current_position > 100 THEN
    position_score := 30;
  ELSIF p_competitor_position < p_current_position THEN
    position_score := LEAST(30, (p_current_position - p_competitor_position));
  ELSE
    position_score := 0;
  END IF;

  total_score := volume_score + difficulty_score + position_score;

  RETURN LEAST(100, total_score);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate opportunity scores
CREATE OR REPLACE FUNCTION update_competitor_keyword_opportunity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.opportunity_score := calculate_keyword_opportunity_score(
    NEW.search_volume,
    NEW.difficulty,
    NEW.our_position,
    NEW.position
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_competitor_keyword_opportunity
  BEFORE INSERT OR UPDATE ON public.seo_competitor_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_keyword_opportunity();
