-- Visual Search History Table
CREATE TABLE IF NOT EXISTS public.visual_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  search_results JSONB NOT NULL DEFAULT '[]',
  filters_applied JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Recommendations Table
CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  recommended_listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('similar', 'complementary', 'frequently_bought_together', 'trending')),
  score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, recommended_listing_id, recommendation_type)
);

-- Seller Price Analytics Table
CREATE TABLE IF NOT EXISTS public.seller_price_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  avg_market_price DECIMAL(10,2) NOT NULL,
  seller_avg_price DECIMAL(10,2) NOT NULL,
  price_percentile INTEGER NOT NULL,
  competitor_count INTEGER NOT NULL DEFAULT 0,
  recommendation TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reorder History Table
CREATE TABLE IF NOT EXISTS public.reorder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reorder_count INTEGER NOT NULL DEFAULT 1,
  last_reordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, original_order_id)
);

-- Photo Quality Scores Table
CREATE TABLE IF NOT EXISTS public.photo_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  issues JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visual_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_price_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_quality_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visual_search_history
CREATE POLICY "Users can view their own search history" ON public.visual_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" ON public.visual_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON public.visual_search_history
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for product_recommendations
CREATE POLICY "Anyone can view product recommendations" ON public.product_recommendations
  FOR SELECT USING (true);

CREATE POLICY "System can manage product recommendations" ON public.product_recommendations
  FOR ALL USING (true);

-- RLS Policies for seller_price_analytics
CREATE POLICY "Sellers can view their own price analytics" ON public.seller_price_analytics
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "System can manage price analytics" ON public.seller_price_analytics
  FOR ALL USING (true);

-- RLS Policies for reorder_history
CREATE POLICY "Users can view their own reorder history" ON public.reorder_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reorder history" ON public.reorder_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reorder history" ON public.reorder_history
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for photo_quality_scores
CREATE POLICY "Sellers can view scores for their listings" ON public.photo_quality_scores
  FOR SELECT USING (
    listing_id IN (SELECT id FROM public.listings WHERE seller_id = auth.uid())
  );

CREATE POLICY "System can manage photo quality scores" ON public.photo_quality_scores
  FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_visual_search_user ON public.visual_search_history(user_id);
CREATE INDEX idx_visual_search_created ON public.visual_search_history(created_at DESC);
CREATE INDEX idx_recommendations_listing ON public.product_recommendations(listing_id);
CREATE INDEX idx_recommendations_type ON public.product_recommendations(recommendation_type);
CREATE INDEX idx_price_analytics_seller ON public.seller_price_analytics(seller_id);
CREATE INDEX idx_price_analytics_category ON public.seller_price_analytics(category_id);
CREATE INDEX idx_reorder_user ON public.reorder_history(user_id);
CREATE INDEX idx_reorder_order ON public.reorder_history(original_order_id);
CREATE INDEX idx_photo_quality_listing ON public.photo_quality_scores(listing_id);