-- Create cities table
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  launch_date DATE,
  hero_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cities table
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Cities are viewable by everyone
CREATE POLICY "Cities are viewable by everyone" 
ON public.cities FOR SELECT USING (true);

-- Add trigger for cities updated_at
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial cities
INSERT INTO public.cities (name, slug, state, description, is_active, launch_date) VALUES
('Chicago', 'chicago', 'Illinois', 'Discover handmade treasures from the Windy City''s vibrant maker community', true, '2024-01-01'),
('Milwaukee', 'milwaukee', 'Wisconsin', 'Coming soon - Join the waitlist for Milwaukee''s artisan marketplace', false, '2024-12-01'),
('Detroit', 'detroit', 'Michigan', 'Coming soon - Motor City makers marketplace launching soon', false, '2025-01-01');

-- Add city_id to profiles table
ALTER TABLE public.profiles ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Add city_id to listings table  
ALTER TABLE public.listings ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Fix categories table - city_id should reference cities, not categories
ALTER TABLE public.categories ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Update existing categories to be associated with Chicago
UPDATE public.categories 
SET city_id = (SELECT id FROM public.cities WHERE slug = 'chicago')
WHERE city_id IS NULL;