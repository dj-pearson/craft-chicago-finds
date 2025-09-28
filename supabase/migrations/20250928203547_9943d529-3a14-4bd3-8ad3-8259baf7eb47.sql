-- Create featured_makers table for storing maker profiles
CREATE TABLE public.featured_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT,
  featured_description TEXT,
  location TEXT,
  neighborhood TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  featured_until DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  city_id UUID REFERENCES public.cities(id),
  social_links JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}'::text[]
);

-- Enable RLS
ALTER TABLE public.featured_makers ENABLE ROW LEVEL SECURITY;

-- Create policies for featured_makers
CREATE POLICY "Featured makers are viewable by everyone" 
ON public.featured_makers 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all featured makers" 
ON public.featured_makers 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "City moderators can manage their city's featured makers" 
ON public.featured_makers 
FOR ALL 
USING (is_city_moderator(auth.uid(), city_id));

CREATE POLICY "Users can update their own featured maker profile" 
ON public.featured_makers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_featured_makers_updated_at
BEFORE UPDATE ON public.featured_makers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create analytics_trends table for storing calculated trend data
CREATE TABLE public.analytics_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'category', 'listing', 'city', 'seller'
  entity_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'views', 'sales', 'revenue', 'growth'
  value NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  city_id UUID REFERENCES public.cities(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(entity_type, entity_id, metric_type, date)
);

-- Enable RLS
ALTER TABLE public.analytics_trends ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_trends
CREATE POLICY "Analytics trends are viewable by admins" 
ON public.analytics_trends 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "City moderators can view their city's analytics trends" 
ON public.analytics_trends 
FOR SELECT 
USING (is_city_moderator(auth.uid(), city_id));

CREATE POLICY "Sellers can view trends for their own listings" 
ON public.analytics_trends 
FOR SELECT 
USING (
  entity_type = 'listing' AND 
  entity_id IN (
    SELECT id FROM public.listings WHERE seller_id = auth.uid()
  )
);

CREATE POLICY "System can manage analytics trends" 
ON public.analytics_trends 
FOR ALL 
USING (true);

-- Create function to calculate category growth rates
CREATE OR REPLACE FUNCTION public.calculate_category_growth_rate(category_uuid uuid, days_back integer DEFAULT 30)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH current_period AS (
    SELECT COUNT(*) as current_views
    FROM listing_analytics la
    JOIN listings l ON la.listing_id = l.id
    WHERE l.category_id = category_uuid
    AND la.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ),
  previous_period AS (
    SELECT COUNT(*) as previous_views
    FROM listing_analytics la
    JOIN listings l ON la.listing_id = l.id
    WHERE l.category_id = category_uuid
    AND la.created_at >= CURRENT_DATE - INTERVAL '1 day' * (days_back * 2)
    AND la.created_at < CURRENT_DATE - INTERVAL '1 day' * days_back
  )
  SELECT 
    CASE 
      WHEN pp.previous_views = 0 THEN 100.0
      ELSE ((cp.current_views::numeric - pp.previous_views::numeric) / pp.previous_views::numeric) * 100
    END
  FROM current_period cp, previous_period pp;
$$;