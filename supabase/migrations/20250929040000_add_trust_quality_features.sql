-- Add trust, quality and support features to the marketplace

-- Add delivery tracking fields to orders table
DO $$
BEGIN
  -- Add shipping lead time fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_ship_date') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_ship_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery_date') THEN
    ALTER TABLE public.orders ADD COLUMN estimated_delivery_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipped_at') THEN
    ALTER TABLE public.orders ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
    ALTER TABLE public.orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'carrier') THEN
    ALTER TABLE public.orders ADD COLUMN carrier TEXT;
  END IF;
END $$;

-- Add shipping settings to listings table
DO $$
BEGIN
  -- Add seller lead time and shipping preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'processing_time_days') THEN
    ALTER TABLE public.listings ADD COLUMN processing_time_days INTEGER DEFAULT 3;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'shipping_time_days') THEN
    ALTER TABLE public.listings ADD COLUMN shipping_time_days INTEGER DEFAULT 3;
  END IF;
END $$;

-- Create seller_badges table for tracking earned badges
CREATE TABLE IF NOT EXISTS public.seller_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('top_rated', 'fast_shipper', 'great_packaging', 'eco_pack', 'reliable_seller', 'quick_responder')),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metric_value DECIMAL(10,2), -- The value that earned this badge (e.g., avg rating, shipping time)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, badge_type)
);

-- Create seller_metrics table for tracking performance
CREATE TABLE IF NOT EXISTS public.seller_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('avg_rating', 'shipping_speed', 'response_time', 'packaging_score', 'eco_score', 'completion_rate')),
  metric_value DECIMAL(10,4) NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0, -- Number of orders/reviews used to calculate
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, metric_type)
);

-- Enhance reviews table with photo review attributes
DO $$
BEGIN
  -- Add review attributes for quality tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'attributes') THEN
    ALTER TABLE public.reviews ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Add helpful votes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'helpful_votes') THEN
    ALTER TABLE public.reviews ADD COLUMN helpful_votes INTEGER DEFAULT 0;
  END IF;
  
  -- Add verified purchase flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'verified_purchase') THEN
    ALTER TABLE public.reviews ADD COLUMN verified_purchase BOOLEAN DEFAULT true;
  END IF;
  
  -- Add packaging/shipping specific ratings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'packaging_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN packaging_rating INTEGER CHECK (packaging_rating >= 1 AND packaging_rating <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'shipping_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN shipping_rating INTEGER CHECK (shipping_rating >= 1 AND shipping_rating <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'quality_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5);
  END IF;
END $$;

-- Create protection_claims table for buyer protection
CREATE TABLE IF NOT EXISTS public.protection_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('not_as_described', 'damaged', 'not_received', 'wrong_item', 'defective')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'resolved')),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  buyer_photos TEXT[] DEFAULT '{}',
  seller_response TEXT,
  seller_photos TEXT[] DEFAULT '{}',
  admin_notes TEXT,
  resolution_type TEXT CHECK (resolution_type IN ('full_refund', 'partial_refund', 'replacement', 'store_credit', 'no_action')),
  refund_amount DECIMAL(10,2),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create refund_requests table for tracking refunds
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  protection_claim_id UUID REFERENCES public.protection_claims(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  refund_amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
  stripe_refund_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review_helpfulness table for tracking helpful votes
CREATE TABLE IF NOT EXISTS public.review_helpfulness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.seller_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protection_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Create policies for seller_badges
CREATE POLICY "Anyone can view active seller badges" 
ON public.seller_badges 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage seller badges" 
ON public.seller_badges 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create policies for seller_metrics
CREATE POLICY "Anyone can view seller metrics" 
ON public.seller_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "System can update seller metrics" 
ON public.seller_metrics 
FOR ALL 
USING (true); -- This will be restricted in application logic

-- Create policies for protection_claims
CREATE POLICY "Users can view their own protection claims" 
ON public.protection_claims 
FOR SELECT 
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create protection claims" 
ON public.protection_claims 
FOR INSERT 
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Claim participants can update claims" 
ON public.protection_claims 
FOR UPDATE 
USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can view all protection claims" 
ON public.protection_claims 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create policies for refund_requests
CREATE POLICY "Users can view their own refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (
  requested_by = auth.uid() OR 
  order_id IN (
    SELECT id FROM public.orders 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

CREATE POLICY "Users can create refund requests" 
ON public.refund_requests 
FOR INSERT 
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can manage refund requests" 
ON public.refund_requests 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create policies for review_helpfulness
CREATE POLICY "Users can manage their own helpfulness votes" 
ON public.review_helpfulness 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view helpfulness votes" 
ON public.review_helpfulness 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_badges_seller ON public.seller_badges(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_badges_type ON public.seller_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_seller_badges_active ON public.seller_badges(is_active);

CREATE INDEX IF NOT EXISTS idx_seller_metrics_seller ON public.seller_metrics(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_metrics_type ON public.seller_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_protection_claims_order ON public.protection_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_buyer ON public.protection_claims(buyer_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_seller ON public.protection_claims(seller_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_status ON public.protection_claims(status);

CREATE INDEX IF NOT EXISTS idx_refund_requests_order ON public.refund_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review ON public.review_helpfulness(review_id);

CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON public.orders(estimated_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON public.orders(shipped_at);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_seller_badges_updated_at
BEFORE UPDATE ON public.seller_badges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_metrics_updated_at
BEFORE UPDATE ON public.seller_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_protection_claims_updated_at
BEFORE UPDATE ON public.protection_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate delivery promise dates
CREATE OR REPLACE FUNCTION public.calculate_delivery_dates(
  processing_days INTEGER,
  shipping_days INTEGER,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  estimated_ship_date DATE,
  estimated_delivery_date DATE
) 
LANGUAGE plpgsql
AS $$
DECLARE
  current_date DATE := order_date::DATE;
  ship_date DATE;
  delivery_date DATE;
  day_counter INTEGER := 0;
BEGIN
  -- Calculate ship date (skip weekends)
  ship_date := current_date;
  WHILE day_counter < processing_days LOOP
    ship_date := ship_date + INTERVAL '1 day';
    -- Skip weekends
    IF EXTRACT(DOW FROM ship_date) NOT IN (0, 6) THEN
      day_counter := day_counter + 1;
    END IF;
  END LOOP;
  
  -- Calculate delivery date from ship date (skip weekends)
  delivery_date := ship_date;
  day_counter := 0;
  WHILE day_counter < shipping_days LOOP
    delivery_date := delivery_date + INTERVAL '1 day';
    -- Skip weekends
    IF EXTRACT(DOW FROM delivery_date) NOT IN (0, 6) THEN
      day_counter := day_counter + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT ship_date, delivery_date;
END;
$$;

-- Function to update seller metrics
CREATE OR REPLACE FUNCTION public.update_seller_metrics(seller_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating DECIMAL(10,4);
  rating_count INTEGER;
  avg_shipping_days DECIMAL(10,4);
  shipping_count INTEGER;
  completion_rate DECIMAL(10,4);
  total_orders INTEGER;
  completed_orders INTEGER;
  avg_packaging_rating DECIMAL(10,4);
  packaging_count INTEGER;
BEGIN
  -- Calculate average rating
  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, rating_count
  FROM public.reviews r
  JOIN public.orders o ON r.order_id = o.id
  WHERE o.seller_id = seller_uuid AND r.review_type = 'seller';
  
  -- Update or insert average rating metric
  IF rating_count > 0 THEN
    INSERT INTO public.seller_metrics (seller_id, metric_type, metric_value, sample_size)
    VALUES (seller_uuid, 'avg_rating', avg_rating, rating_count)
    ON CONFLICT (seller_id, metric_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      sample_size = EXCLUDED.sample_size,
      last_calculated = NOW();
  END IF;
  
  -- Calculate average shipping speed (days from order to ship)
  SELECT AVG(EXTRACT(EPOCH FROM (shipped_at - created_at))/86400), COUNT(*)
  INTO avg_shipping_days, shipping_count
  FROM public.orders
  WHERE seller_id = seller_uuid AND shipped_at IS NOT NULL;
  
  IF shipping_count > 0 THEN
    INSERT INTO public.seller_metrics (seller_id, metric_type, metric_value, sample_size)
    VALUES (seller_uuid, 'shipping_speed', avg_shipping_days, shipping_count)
    ON CONFLICT (seller_id, metric_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      sample_size = EXCLUDED.sample_size,
      last_calculated = NOW();
  END IF;
  
  -- Calculate completion rate
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('delivered', 'completed'))
  INTO total_orders, completed_orders
  FROM public.orders
  WHERE seller_id = seller_uuid;
  
  IF total_orders > 0 THEN
    completion_rate := (completed_orders::DECIMAL / total_orders) * 100;
    INSERT INTO public.seller_metrics (seller_id, metric_type, metric_value, sample_size)
    VALUES (seller_uuid, 'completion_rate', completion_rate, total_orders)
    ON CONFLICT (seller_id, metric_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      sample_size = EXCLUDED.sample_size,
      last_calculated = NOW();
  END IF;
  
  -- Calculate average packaging rating
  SELECT AVG(packaging_rating), COUNT(*)
  INTO avg_packaging_rating, packaging_count
  FROM public.reviews r
  JOIN public.orders o ON r.order_id = o.id
  WHERE o.seller_id = seller_uuid AND r.packaging_rating IS NOT NULL;
  
  IF packaging_count > 0 THEN
    INSERT INTO public.seller_metrics (seller_id, metric_type, metric_value, sample_size)
    VALUES (seller_uuid, 'packaging_score', avg_packaging_rating, packaging_count)
    ON CONFLICT (seller_id, metric_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      sample_size = EXCLUDED.sample_size,
      last_calculated = NOW();
  END IF;
END;
$$;

-- Function to award badges based on metrics
CREATE OR REPLACE FUNCTION public.update_seller_badges(seller_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rating_metric DECIMAL(10,4);
  shipping_metric DECIMAL(10,4);
  packaging_metric DECIMAL(10,4);
  completion_metric DECIMAL(10,4);
  rating_sample INTEGER;
  shipping_sample INTEGER;
BEGIN
  -- Get current metrics
  SELECT metric_value, sample_size INTO rating_metric, rating_sample
  FROM public.seller_metrics 
  WHERE seller_id = seller_uuid AND metric_type = 'avg_rating';
  
  SELECT metric_value, sample_size INTO shipping_metric, shipping_sample
  FROM public.seller_metrics 
  WHERE seller_id = seller_uuid AND metric_type = 'shipping_speed';
  
  SELECT metric_value INTO packaging_metric
  FROM public.seller_metrics 
  WHERE seller_id = seller_uuid AND metric_type = 'packaging_score';
  
  SELECT metric_value INTO completion_metric
  FROM public.seller_metrics 
  WHERE seller_id = seller_uuid AND metric_type = 'completion_rate';
  
  -- Award Top Rated badge (4.5+ rating with 10+ reviews)
  IF rating_metric >= 4.5 AND rating_sample >= 10 THEN
    INSERT INTO public.seller_badges (seller_id, badge_type, metric_value)
    VALUES (seller_uuid, 'top_rated', rating_metric)
    ON CONFLICT (seller_id, badge_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      earned_at = NOW(),
      is_active = true;
  END IF;
  
  -- Award Fast Shipper badge (ships within 2 days on average with 5+ orders)
  IF shipping_metric <= 2.0 AND shipping_sample >= 5 THEN
    INSERT INTO public.seller_badges (seller_id, badge_type, metric_value)
    VALUES (seller_uuid, 'fast_shipper', shipping_metric)
    ON CONFLICT (seller_id, badge_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      earned_at = NOW(),
      is_active = true;
  END IF;
  
  -- Award Great Packaging badge (4.5+ packaging rating)
  IF packaging_metric >= 4.5 THEN
    INSERT INTO public.seller_badges (seller_id, badge_type, metric_value)
    VALUES (seller_uuid, 'great_packaging', packaging_metric)
    ON CONFLICT (seller_id, badge_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      earned_at = NOW(),
      is_active = true;
  END IF;
  
  -- Award Reliable Seller badge (95%+ completion rate)
  IF completion_metric >= 95.0 THEN
    INSERT INTO public.seller_badges (seller_id, badge_type, metric_value)
    VALUES (seller_uuid, 'reliable_seller', completion_metric)
    ON CONFLICT (seller_id, badge_type) 
    DO UPDATE SET 
      metric_value = EXCLUDED.metric_value,
      earned_at = NOW(),
      is_active = true;
  END IF;
END;
$$;
