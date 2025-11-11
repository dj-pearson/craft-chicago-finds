-- Fix missing table permissions for anonymous users
-- Without these GRANTs, RLS policies don't work for anon users

-- Grant SELECT on core tables to anonymous and authenticated users
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT SELECT ON public.featured_slots TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- Grant SELECT on related tables that may be needed for marketplace browsing
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.listing_favorites TO authenticated;

-- Ensure listing_favorites has proper RLS for authenticated users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'listing_favorites' 
    AND policyname = 'Users can manage their own favorites'
  ) THEN
    CREATE POLICY "Users can manage their own favorites"
      ON listing_favorites
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;