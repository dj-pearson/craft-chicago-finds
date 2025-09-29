-- Add speed and polish features to the marketplace

-- Table for user favorites (smart save without login)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Table for user recent views (smart save without login)
CREATE TABLE IF NOT EXISTS public.user_recent_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Table for performance analytics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  lcp DECIMAL(10,2), -- Largest Contentful Paint
  fid DECIMAL(10,2), -- First Input Delay
  cls DECIMAL(10,4), -- Cumulative Layout Shift
  fcp DECIMAL(10,2), -- First Contentful Paint
  ttfb DECIMAL(10,2), -- Time to First Byte
  dom_content_loaded DECIMAL(10,2),
  load_complete DECIMAL(10,2),
  user_agent TEXT,
  connection_type TEXT,
  device_type TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for accessibility settings (optional server-side sync)
CREATE TABLE IF NOT EXISTS public.user_accessibility_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  high_contrast BOOLEAN DEFAULT FALSE,
  reduced_motion BOOLEAN DEFAULT FALSE,
  large_text BOOLEAN DEFAULT FALSE,
  screen_reader BOOLEAN DEFAULT FALSE,
  focus_visible BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recent_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accessibility_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_favorites
CREATE POLICY "Users can manage their own favorites" 
ON public.user_favorites 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view favorite counts" 
ON public.user_favorites 
FOR SELECT 
USING (true); -- Allow counting favorites for listings

-- Create policies for user_recent_views
CREATE POLICY "Users can manage their own recent views" 
ON public.user_recent_views 
FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for performance_metrics
CREATE POLICY "Users can insert their own performance metrics" 
ON public.performance_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all performance metrics" 
ON public.performance_metrics 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create policies for user_accessibility_settings
CREATE POLICY "Users can manage their own accessibility settings" 
ON public.user_accessibility_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_listing ON public.user_favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created ON public.user_favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_recent_views_user ON public.user_recent_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recent_views_listing ON public.user_recent_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_recent_views_viewed ON public.user_recent_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session ON public.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_url ON public.performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created ON public.performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_lcp ON public.performance_metrics(lcp) WHERE lcp IS NOT NULL;

-- Add trigger for accessibility settings updated_at
CREATE TRIGGER update_user_accessibility_settings_updated_at
BEFORE UPDATE ON public.user_accessibility_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get favorite count for a listing
CREATE OR REPLACE FUNCTION public.get_listing_favorite_count(listing_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_favorites
  WHERE listing_id = listing_uuid;
$$;

-- Function to check if user has favorited a listing
CREATE OR REPLACE FUNCTION public.is_listing_favorited(listing_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.user_favorites
    WHERE listing_id = listing_uuid AND user_id = user_uuid
  );
$$;

-- Function to get user's recent views with listing details
CREATE OR REPLACE FUNCTION public.get_user_recent_views(user_uuid UUID DEFAULT auth.uid(), view_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  seller_name TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    p.display_name,
    rv.viewed_at
  FROM public.user_recent_views rv
  JOIN public.listings l ON rv.listing_id = l.id
  LEFT JOIN public.profiles p ON l.seller_id = p.id
  WHERE rv.user_id = user_uuid
    AND l.status = 'active'
  ORDER BY rv.viewed_at DESC
  LIMIT view_limit;
$$;

-- Function to get user's favorites with listing details
CREATE OR REPLACE FUNCTION public.get_user_favorites(user_uuid UUID DEFAULT auth.uid(), fav_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  seller_name TEXT,
  favorited_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    p.display_name,
    f.created_at
  FROM public.user_favorites f
  JOIN public.listings l ON f.listing_id = l.id
  LEFT JOIN public.profiles p ON l.seller_id = p.id
  WHERE f.user_id = user_uuid
    AND l.status = 'active'
  ORDER BY f.created_at DESC
  LIMIT fav_limit;
$$;

-- Function to clean up old performance metrics (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_performance_metrics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.performance_metrics
  WHERE created_at < NOW() - INTERVAL '30 days';
$$;

-- Function to get performance analytics summary
CREATE OR REPLACE FUNCTION public.get_performance_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  avg_lcp DECIMAL(10,2),
  avg_fid DECIMAL(10,2),
  avg_cls DECIMAL(10,4),
  avg_fcp DECIMAL(10,2),
  avg_ttfb DECIMAL(10,2),
  total_sessions INTEGER,
  good_lcp_percentage DECIMAL(5,2),
  good_fid_percentage DECIMAL(5,2),
  good_cls_percentage DECIMAL(5,2)
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    AVG(lcp)::DECIMAL(10,2),
    AVG(fid)::DECIMAL(10,2),
    AVG(cls)::DECIMAL(10,4),
    AVG(fcp)::DECIMAL(10,2),
    AVG(ttfb)::DECIMAL(10,2),
    COUNT(DISTINCT session_id)::INTEGER,
    (COUNT(*) FILTER (WHERE lcp <= 2500) * 100.0 / COUNT(*) FILTER (WHERE lcp IS NOT NULL))::DECIMAL(5,2),
    (COUNT(*) FILTER (WHERE fid <= 100) * 100.0 / COUNT(*) FILTER (WHERE fid IS NOT NULL))::DECIMAL(5,2),
    (COUNT(*) FILTER (WHERE cls <= 0.1) * 100.0 / COUNT(*) FILTER (WHERE cls IS NOT NULL))::DECIMAL(5,2)
  FROM public.performance_metrics
  WHERE created_at BETWEEN start_date AND end_date;
$$;

-- Add image optimization tracking to existing listings
DO $$
BEGIN
  -- Add columns for image optimization if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'optimized_images') THEN
    ALTER TABLE public.listings ADD COLUMN optimized_images JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'image_cdn_urls') THEN
    ALTER TABLE public.listings ADD COLUMN image_cdn_urls TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'preload_priority') THEN
    ALTER TABLE public.listings ADD COLUMN preload_priority INTEGER DEFAULT 0; -- 0 = normal, 1 = high, 2 = critical
  END IF;
END $$;

-- Create a view for popular listings (for prefetch optimization)
CREATE OR REPLACE VIEW public.popular_listings AS
SELECT 
  l.*,
  COALESCE(f.favorite_count, 0) as favorite_count,
  COALESCE(v.recent_view_count, 0) as recent_view_count,
  COALESCE(f.favorite_count, 0) + COALESCE(v.recent_view_count, 0) as popularity_score
FROM public.listings l
LEFT JOIN (
  SELECT listing_id, COUNT(*) as favorite_count
  FROM public.user_favorites
  GROUP BY listing_id
) f ON l.id = f.listing_id
LEFT JOIN (
  SELECT listing_id, COUNT(*) as recent_view_count
  FROM public.user_recent_views
  WHERE viewed_at > NOW() - INTERVAL '7 days'
  GROUP BY listing_id
) v ON l.id = v.listing_id
WHERE l.status = 'active'
ORDER BY popularity_score DESC;

-- Grant necessary permissions
GRANT SELECT ON public.popular_listings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_listing_favorite_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_listing_favorited(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recent_views(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favorites(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_performance_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_performance_metrics() TO authenticated;

-- Create a scheduled job to clean up old performance metrics (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-performance-metrics', '0 2 * * *', 'SELECT public.cleanup_old_performance_metrics();');
