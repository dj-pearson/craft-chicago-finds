-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.increment_listing_views(listing_uuid UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings 
  SET view_count = view_count + 1 
  WHERE id = listing_uuid;
$$;