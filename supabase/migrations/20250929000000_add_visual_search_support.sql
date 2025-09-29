-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add visual search support to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_embeddings VECTOR(512);
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS primary_image_url TEXT;

-- Add index for vector similarity search
CREATE INDEX IF NOT EXISTS listings_image_embeddings_idx ON public.listings 
USING ivfflat (image_embeddings vector_cosine_ops) WITH (lists = 100);

-- Add function to calculate image similarity
CREATE OR REPLACE FUNCTION public.find_similar_products(
  query_embedding VECTOR(512),
  city_uuid UUID DEFAULT NULL,
  exclude_product_uuid UUID DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.5,
  max_results INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL(10,2),
  images TEXT[],
  similarity_score FLOAT,
  seller_id UUID
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.price,
    l.images,
    (1 - (l.image_embeddings <=> query_embedding)) as similarity_score,
    l.seller_id
  FROM listings l
  WHERE 
    l.status = 'active' AND
    l.image_embeddings IS NOT NULL AND
    (city_uuid IS NULL OR l.city_id = city_uuid) AND
    (exclude_product_uuid IS NULL OR l.id != exclude_product_uuid) AND
    (1 - (l.image_embeddings <=> query_embedding)) >= similarity_threshold
  ORDER BY l.image_embeddings <=> query_embedding
  LIMIT max_results;
END;
$$;

-- Create temp storage bucket for visual search images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('temp-images', 'temp-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for temp images bucket
CREATE POLICY "Allow public uploads to temp-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'temp-images');

CREATE POLICY "Allow public reads from temp-images" ON storage.objects
FOR SELECT USING (bucket_id = 'temp-images');

CREATE POLICY "Allow public deletes from temp-images" ON storage.objects
FOR DELETE USING (bucket_id = 'temp-images');

-- Add enhanced search analytics
-- Update search_analytics table to support visual search tracking
-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add search_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_analytics' AND column_name = 'search_type') THEN
    ALTER TABLE public.search_analytics ADD COLUMN search_type TEXT NOT NULL DEFAULT 'text' CHECK (search_type IN ('text', 'visual', 'filter'));
  END IF;
  
  -- Add session_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_analytics' AND column_name = 'session_id') THEN
    ALTER TABLE public.search_analytics ADD COLUMN session_id TEXT;
  END IF;
  
  -- Add query_text column (rename from query if needed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_analytics' AND column_name = 'query_text') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_analytics' AND column_name = 'query') THEN
      ALTER TABLE public.search_analytics RENAME COLUMN query TO query_text;
    ELSE
      ALTER TABLE public.search_analytics ADD COLUMN query_text TEXT;
    END IF;
  END IF;
  
  -- Add image_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_analytics' AND column_name = 'image_url') THEN
    ALTER TABLE public.search_analytics ADD COLUMN image_url TEXT;
  END IF;
  
  -- Add click_through_rate column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_analytics' AND column_name = 'click_through_rate') THEN
    ALTER TABLE public.search_analytics ADD COLUMN click_through_rate FLOAT DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on search analytics
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for search analytics
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Anyone can insert search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins can view all search analytics" ON public.search_analytics;

CREATE POLICY "Users can view their own search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert search analytics"
ON public.search_analytics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS search_analytics_user_id_idx ON public.search_analytics(user_id);
CREATE INDEX IF NOT EXISTS search_analytics_city_id_idx ON public.search_analytics(city_id);
CREATE INDEX IF NOT EXISTS search_analytics_search_type_idx ON public.search_analytics(search_type);
CREATE INDEX IF NOT EXISTS search_analytics_created_at_idx ON public.search_analytics(created_at);

-- Add function to track search analytics
CREATE OR REPLACE FUNCTION public.track_search(
  p_search_type TEXT,
  p_query_text TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_filters_used JSONB DEFAULT '{}'::jsonb,
  p_results_count INTEGER DEFAULT 0,
  p_city_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO search_analytics (
    user_id,
    session_id,
    search_type,
    query_text,
    image_url,
    filters_used,
    results_count,
    city_id
  ) VALUES (
    auth.uid(),
    p_session_id,
    p_search_type,
    p_query_text,
    p_image_url,
    p_filters_used,
    p_results_count,
    p_city_id
  ) RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$;
