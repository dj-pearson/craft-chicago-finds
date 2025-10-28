/**
 * Category data hooks using React Query
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single category
 */
export function useCategory(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['category', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!idOrSlug,
  });
}
