-- Create storage buckets for product images
INSERT INTO storage.buckets (id, name, public) VALUES 
('product-images', 'product-images', true);

-- Create storage policies for product images
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update listings table to make seller_id and city_id required for new listings
-- Add indexes for better performance
CREATE INDEX idx_listings_seller_city ON public.listings(seller_id, city_id);
CREATE INDEX idx_listings_status_city ON public.listings(status, city_id);
CREATE INDEX idx_listings_category_city ON public.listings(category_id, city_id);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);

-- Add product view count tracking
ALTER TABLE public.listings ADD COLUMN view_count INTEGER DEFAULT 0;

-- Create listing analytics table
CREATE TABLE public.listing_analytics (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'favorite', 'inquiry', 'purchase')),
  user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics table
ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics policies
CREATE POLICY "Sellers can view their listing analytics"
  ON public.listing_analytics FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM public.listings WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics events"
  ON public.listing_analytics FOR INSERT
  WITH CHECK (true);

-- Add listing favorites table
CREATE TABLE public.listing_favorites (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS on favorites
ALTER TABLE public.listing_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
  ON public.listing_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Add some useful functions
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_uuid UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.listings 
  SET view_count = view_count + 1 
  WHERE id = listing_uuid;
$$;