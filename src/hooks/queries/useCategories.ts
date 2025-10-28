import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export const useCategories = (cityId: string | undefined) => {
  return useQuery({
    queryKey: queryKeys.categories(cityId || ''),
    queryFn: async (): Promise<Category[]> => {
      if (!cityId) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('city_id', cityId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!cityId,
  });
};
