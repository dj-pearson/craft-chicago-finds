-- Create function to decrement inventory
CREATE OR REPLACE FUNCTION public.decrement_inventory(listing_uuid uuid, quantity integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE public.listings 
  SET inventory_count = GREATEST(0, inventory_count - quantity)
  WHERE id = listing_uuid AND inventory_count IS NOT NULL;
$$;