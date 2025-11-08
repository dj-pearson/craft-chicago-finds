-- Create junction table to link blog articles with products
-- This enables "Shop This Article" functionality

CREATE TABLE IF NOT EXISTS public.blog_article_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.blog_articles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  -- Display configuration
  display_order INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  custom_description TEXT, -- Optional override for product description in article context

  -- Tracking
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Ensure unique article-listing pairs
  UNIQUE(article_id, listing_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_article_products_article ON public.blog_article_products(article_id);
CREATE INDEX IF NOT EXISTS idx_blog_article_products_listing ON public.blog_article_products(listing_id);
CREATE INDEX IF NOT EXISTS idx_blog_article_products_featured ON public.blog_article_products(article_id, featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_blog_article_products_display_order ON public.blog_article_products(article_id, display_order);

-- Enable Row Level Security
ALTER TABLE public.blog_article_products ENABLE ROW LEVEL SECURITY;

-- Public can view product associations for published articles
CREATE POLICY "Anyone can view products linked to published articles"
ON public.blog_article_products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.blog_articles
    WHERE id = article_id
    AND status = 'published'
  )
);

-- Admins can manage product associations
CREATE POLICY "Admins can manage article product links"
ON public.blog_article_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  )
);

-- Function to track product clicks from blog articles
CREATE OR REPLACE FUNCTION increment_blog_product_click(
  p_article_id UUID,
  p_listing_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blog_article_products
  SET clicks = clicks + 1
  WHERE article_id = p_article_id
  AND listing_id = p_listing_id;
END;
$$;

-- Function to track conversions from blog articles
CREATE OR REPLACE FUNCTION track_blog_product_conversion(
  p_article_id UUID,
  p_listing_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blog_article_products
  SET conversions = conversions + 1
  WHERE article_id = p_article_id
  AND listing_id = p_listing_id;

  -- Also update blog analytics conversion rate
  UPDATE public.blog_analytics
  SET conversion_rate = (
    SELECT (SUM(conversions)::DECIMAL / NULLIF(SUM(clicks), 0) * 100)
    FROM public.blog_article_products
    WHERE article_id = p_article_id
  )
  WHERE article_id = p_article_id
  AND date = CURRENT_DATE;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_blog_article_products_updated_at
BEFORE UPDATE ON public.blog_article_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.blog_article_products IS 'Junction table linking blog articles to products for "Shop This Article" feature. Enables content-to-commerce connections.';
COMMENT ON COLUMN public.blog_article_products.display_order IS 'Controls the order products appear in the article. Lower numbers appear first.';
COMMENT ON COLUMN public.blog_article_products.featured IS 'Featured products are highlighted more prominently in the article UI.';
COMMENT ON COLUMN public.blog_article_products.custom_description IS 'Optional context-specific product description for this article (e.g., "Perfect for winter gifts" when article is about holiday shopping).';
