import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import type { Listing } from './useListings';

export const useListing = (
  listingId: string | undefined,
  cityId: string | undefined
) => {
  return useQuery({
    queryKey: queryKeys.listing(listingId || '', cityId || ''),
    queryFn: async (): Promise<Listing | null> => {
      if (!listingId || !cityId) return null;

      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          categories(id, name, slug)
        `
        )
        .eq('id', listingId)
        .eq('city_id', cityId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        throw error;
      }

      // Increment view count (fire and forget)
      supabase.rpc('increment_listing_views', { listing_uuid: listingId });

      return data;
    },
    enabled: !!listingId && !!cityId,
    // Refetch less frequently for individual listings
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
