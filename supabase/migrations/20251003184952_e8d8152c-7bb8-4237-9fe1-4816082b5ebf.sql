-- Create order_items table for line items in orders
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES auth.users(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_images TEXT[] DEFAULT '{}'::text[],
  customization_options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for order_items
CREATE POLICY "Users can view their order items"
  ON public.order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "System can manage order items"
  ON public.order_items
  FOR ALL
  USING (true);

-- Create indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON public.order_items(listing_id);
CREATE INDEX idx_order_items_seller_id ON public.order_items(seller_id);

-- Create trigger for updated_at
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();