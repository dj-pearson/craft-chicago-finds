-- SEO Management System: Google Search Console Integration
-- Migration 2 of 6: Tables for Google Search Console data and OAuth

-- GSC OAuth Credentials - Store Google OAuth tokens securely
CREATE TABLE IF NOT EXISTS public.gsc_oauth_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  is_active BOOLEAN DEFAULT true,
  last_refreshed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- GSC Properties - Verified properties in Google Search Console
CREATE TABLE IF NOT EXISTS public.gsc_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_url TEXT NOT NULL UNIQUE,
  property_type TEXT CHECK (property_type IN ('Domain', 'URL_prefix')),
  permission_level TEXT CHECK (permission_level IN ('siteOwner', 'siteFullUser', 'siteRestrictedUser', 'siteUnverifiedUser')),
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GSC Keyword Performance - Search query data from GSC
CREATE TABLE IF NOT EXISTS public.gsc_keyword_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.gsc_properties(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet')),
  date DATE NOT NULL,

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  position DECIMAL(5,2),

  -- Comparison with previous period
  clicks_change INTEGER,
  impressions_change INTEGER,
  ctr_change DECIMAL(5,2),
  position_change DECIMAL(5,2),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, query, date, device, country)
);

CREATE INDEX IF NOT EXISTS idx_gsc_keyword_performance_property ON public.gsc_keyword_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_performance_query ON public.gsc_keyword_performance(query);
CREATE INDEX IF NOT EXISTS idx_gsc_keyword_performance_date ON public.gsc_keyword_performance(date DESC);

-- GSC Page Performance - URL performance data from GSC
CREATE TABLE IF NOT EXISTS public.gsc_page_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.gsc_properties(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet')),
  date DATE NOT NULL,

  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),
  position DECIMAL(5,2),

  -- Top queries for this page
  top_queries JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, page_url, date, device, country)
);

CREATE INDEX IF NOT EXISTS idx_gsc_page_performance_property ON public.gsc_page_performance(property_id);
CREATE INDEX IF NOT EXISTS idx_gsc_page_performance_url ON public.gsc_page_performance(page_url);
CREATE INDEX IF NOT EXISTS idx_gsc_page_performance_date ON public.gsc_page_performance(date DESC);

-- Enable Row Level Security
ALTER TABLE public.gsc_oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_page_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admin full access to gsc_oauth_credentials"
  ON public.gsc_oauth_credentials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to gsc_properties"
  ON public.gsc_properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to gsc_keyword_performance"
  ON public.gsc_keyword_performance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin full access to gsc_page_performance"
  ON public.gsc_page_performance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to refresh expired OAuth tokens
CREATE OR REPLACE FUNCTION refresh_gsc_oauth_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-refresh tokens that are expiring soon (within 1 hour)
  IF NEW.expires_at < (NOW() + INTERVAL '1 hour') AND NEW.is_active = true THEN
    -- Token refresh will be handled by Edge Function
    -- This just marks that refresh is needed
    NEW.last_refreshed = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_gsc_oauth_token
  BEFORE UPDATE ON public.gsc_oauth_credentials
  FOR EACH ROW
  EXECUTE FUNCTION refresh_gsc_oauth_token();

-- Function to update keyword rankings in seo_keywords from GSC data
CREATE OR REPLACE FUNCTION sync_gsc_to_seo_keywords()
RETURNS TRIGGER AS $$
DECLARE
  keyword_record RECORD;
BEGIN
  -- Update seo_keywords table with latest GSC position data
  UPDATE public.seo_keywords
  SET
    current_position = ROUND(NEW.position)::INTEGER,
    previous_position = current_position,
    updated_at = NOW()
  WHERE keyword = NEW.query
    AND target_url = (
      SELECT property_url FROM public.gsc_properties WHERE id = NEW.property_id
    );

  -- If keyword doesn't exist, optionally create it
  IF NOT FOUND THEN
    INSERT INTO public.seo_keywords (
      keyword,
      target_url,
      current_position,
      search_volume,
      status
    )
    SELECT
      NEW.query,
      p.property_url,
      ROUND(NEW.position)::INTEGER,
      NEW.impressions,
      'active'
    FROM public.gsc_properties p
    WHERE p.id = NEW.property_id
    ON CONFLICT (keyword, target_url) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_gsc_to_seo_keywords
  AFTER INSERT OR UPDATE ON public.gsc_keyword_performance
  FOR EACH ROW
  EXECUTE FUNCTION sync_gsc_to_seo_keywords();
