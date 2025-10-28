/**
 * Product data hooks using React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductFilters {
  category_id?: string;
  search?: string;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
}

/**
 * Fetch products with filters
 */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true);

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.featured) {
        query = query.eq('featured', true);
      }

      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }

      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch single product
 */
export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['product', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;

      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug), profiles(display_name, avatar_url, city)')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!idOrSlug,
  });
}

/**
 * Fetch featured products
 */
export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create product mutation
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...product, artisan_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product');
    },
  });
}

/**
 * Update product mutation
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
}
