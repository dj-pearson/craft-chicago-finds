-- Add personalization support to the marketplace
-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create personalization_options table
CREATE TABLE public.personalization_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  option_type TEXT NOT NULL CHECK (option_type IN ('text', 'font', 'color', 'size', 'position')),
  option_name TEXT NOT NULL, -- e.g., "Engraving Text", "Font Style", "Text Color"
  option_key TEXT NOT NULL, -- e.g., "engraving_text", "font_family", "text_color"
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_characters INTEGER, -- For text options
  allowed_values JSONB DEFAULT '[]'::jsonb, -- For dropdown options like fonts, colors
  default_value TEXT,
  additional_cost DECIMAL(10,2) DEFAULT 0.00,
  preview_rules JSONB DEFAULT '{}'::jsonb, -- Canvas positioning, styling rules
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_item_personalizations table for storing personalization choices
CREATE TABLE public.cart_item_personalizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_session_id TEXT NOT NULL, -- Links to cart session
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  option_value TEXT NOT NULL,
  preview_data JSONB DEFAULT '{}'::jsonb, -- Stores canvas/SVG positioning data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_item_personalizations for completed orders
CREATE TABLE public.order_item_personalizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  option_value TEXT NOT NULL,
  preview_data JSONB DEFAULT '{}'::jsonb,
  additional_cost DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_order_chats table for photo markup discussions
CREATE TABLE public.custom_order_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  original_image_url TEXT,
  markup_data JSONB DEFAULT '[]'::jsonb, -- Stores drawing annotations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_order_messages table
CREATE TABLE public.custom_order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.custom_order_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'markup')),
  content TEXT,
  image_url TEXT,
  markup_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_bundles table for build-a-bundle feature
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_items INTEGER NOT NULL DEFAULT 2,
  max_items INTEGER,
  auto_discount BOOLEAN NOT NULL DEFAULT true, -- Auto-apply when conditions met
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bundle_items table
CREATE TABLE public.bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_bundles table for user-created bundles
CREATE TABLE public.cart_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_session_id TEXT NOT NULL,
  bundle_name TEXT,
  listing_ids UUID[] NOT NULL,
  total_original_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.personalization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_item_personalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_personalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_bundles ENABLE ROW LEVEL SECURITY;

-- Create policies for personalization_options
CREATE POLICY "Anyone can view personalization options" 
ON public.personalization_options 
FOR SELECT 
USING (true);

CREATE POLICY "Sellers can manage their listing personalization options" 
ON public.personalization_options 
FOR ALL 
USING (
  listing_id IN (
    SELECT id FROM public.listings 
    WHERE seller_id = auth.uid()
  )
);

-- Create policies for cart_item_personalizations
CREATE POLICY "Users can manage their own cart personalizations" 
ON public.cart_item_personalizations 
FOR ALL 
USING (true); -- Cart is session-based, not user-based

-- Create policies for order_item_personalizations
CREATE POLICY "Users can view personalizations for their orders" 
ON public.order_item_personalizations 
FOR SELECT 
USING (
  order_id IN (
    SELECT id FROM public.orders 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

-- Create policies for custom_order_chats
CREATE POLICY "Buyers and sellers can view their custom order chats" 
ON public.custom_order_chats 
FOR SELECT 
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create custom order chats" 
ON public.custom_order_chats 
FOR INSERT 
WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Participants can update custom order chats" 
ON public.custom_order_chats 
FOR UPDATE 
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Create policies for custom_order_messages
CREATE POLICY "Chat participants can view messages" 
ON public.custom_order_messages 
FOR SELECT 
USING (
  chat_id IN (
    SELECT id FROM public.custom_order_chats 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

CREATE POLICY "Chat participants can send messages" 
ON public.custom_order_messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND 
  chat_id IN (
    SELECT id FROM public.custom_order_chats 
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

-- Create policies for product_bundles
CREATE POLICY "Anyone can view active bundles" 
ON public.product_bundles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create bundles" 
ON public.product_bundles 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Bundle creators can manage their bundles" 
ON public.product_bundles 
FOR ALL 
USING (created_by = auth.uid());

-- Create policies for bundle_items
CREATE POLICY "Anyone can view bundle items for active bundles" 
ON public.bundle_items 
FOR SELECT 
USING (
  bundle_id IN (
    SELECT id FROM public.product_bundles WHERE is_active = true
  )
);

CREATE POLICY "Bundle creators can manage bundle items" 
ON public.bundle_items 
FOR ALL 
USING (
  bundle_id IN (
    SELECT id FROM public.product_bundles WHERE created_by = auth.uid()
  )
);

-- Create policies for cart_bundles
CREATE POLICY "Users can manage their own cart bundles" 
ON public.cart_bundles 
FOR ALL 
USING (true); -- Cart is session-based

-- Create indexes for better performance
CREATE INDEX idx_personalization_options_listing ON public.personalization_options(listing_id);
CREATE INDEX idx_cart_item_personalizations_session ON public.cart_item_personalizations(cart_session_id);
CREATE INDEX idx_cart_item_personalizations_listing ON public.cart_item_personalizations(listing_id);
CREATE INDEX idx_order_item_personalizations_order ON public.order_item_personalizations(order_id);
CREATE INDEX idx_custom_order_chats_buyer ON public.custom_order_chats(buyer_id);
CREATE INDEX idx_custom_order_chats_seller ON public.custom_order_chats(seller_id);
CREATE INDEX idx_custom_order_chats_listing ON public.custom_order_chats(listing_id);
CREATE INDEX idx_custom_order_messages_chat ON public.custom_order_messages(chat_id);
CREATE INDEX idx_product_bundles_city ON public.product_bundles(city_id);
CREATE INDEX idx_bundle_items_bundle ON public.bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_listing ON public.bundle_items(listing_id);
CREATE INDEX idx_cart_bundles_session ON public.cart_bundles(cart_session_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_personalization_options_updated_at
BEFORE UPDATE ON public.personalization_options
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_item_personalizations_updated_at
BEFORE UPDATE ON public.cart_item_personalizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_order_chats_updated_at
BEFORE UPDATE ON public.custom_order_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_bundles_updated_at
BEFORE UPDATE ON public.product_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_bundles_updated_at
BEFORE UPDATE ON public.cart_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample personalization options for common product types
INSERT INTO public.personalization_options (listing_id, option_type, option_name, option_key, is_required, max_characters, allowed_values, default_value, additional_cost, preview_rules)
SELECT 
  l.id,
  'text',
  'Engraving Text',
  'engraving_text',
  false,
  50,
  '[]'::jsonb,
  '',
  5.00,
  '{"position": {"x": 0.5, "y": 0.7}, "fontSize": 16, "fontFamily": "Arial", "color": "#000000"}'::jsonb
FROM public.listings l
WHERE l.title ILIKE '%jewelry%' OR l.title ILIKE '%necklace%' OR l.title ILIKE '%bracelet%'
LIMIT 5;

-- Insert font options for text personalization
INSERT INTO public.personalization_options (listing_id, option_type, option_name, option_key, is_required, allowed_values, default_value, preview_rules)
SELECT 
  l.id,
  'font',
  'Font Style',
  'font_family',
  false,
  '["Arial", "Times New Roman", "Helvetica", "Georgia", "Script", "Handwritten"]'::jsonb,
  'Arial',
  '{}'::jsonb
FROM public.listings l
WHERE l.title ILIKE '%jewelry%' OR l.title ILIKE '%necklace%' OR l.title ILIKE '%bracelet%'
LIMIT 5;
