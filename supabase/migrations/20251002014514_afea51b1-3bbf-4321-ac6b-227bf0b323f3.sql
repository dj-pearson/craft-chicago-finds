-- Allow featured_makers to exist as templates without user assignment
ALTER TABLE public.featured_makers 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a comment explaining the nullable user_id
COMMENT ON COLUMN public.featured_makers.user_id IS 'User ID - can be null for template/placeholder featured makers that will be assigned later';

-- Add city_logo_url column to cities table for city-specific branding
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS city_logo_url TEXT;

COMMENT ON COLUMN public.cities.city_logo_url IS 'City-specific logo or branding image URL';
