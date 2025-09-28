-- Add shipping preferences to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS national_shipping_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC,
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC,
ADD COLUMN IF NOT EXISTS estimated_shipping_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS shipping_notes TEXT;

-- Add shipping preferences to profiles table for sellers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ships_nationally BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_shipping_cost NUMERIC,
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_policy TEXT;

-- Create shipping_zones table for more complex shipping rules
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  zone_name TEXT NOT NULL,
  states TEXT[] NOT NULL,
  shipping_cost NUMERIC NOT NULL,
  free_shipping_threshold NUMERIC,
  estimated_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shipping_zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping_zones
CREATE POLICY "Shipping zones are viewable by everyone" 
ON public.shipping_zones 
FOR SELECT 
USING (true);

CREATE POLICY "Sellers can manage their own shipping zones" 
ON public.shipping_zones 
FOR ALL 
USING (auth.uid() = seller_id);

-- Create trigger for shipping_zones timestamps
CREATE TRIGGER update_shipping_zones_updated_at
BEFORE UPDATE ON public.shipping_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if seller ships to a location
CREATE OR REPLACE FUNCTION public.check_shipping_availability(seller_uuid uuid, target_state text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM shipping_zones 
    WHERE seller_id = seller_uuid 
    AND target_state = ANY(states) 
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = seller_uuid 
    AND ships_nationally = true
  );
$$;