/**
 * Category CRUD operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  display_order: number;
  created_at: string;
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch single category by ID or slug
 */
export async function getCategory(idOrSlug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get category with product count
 */
export async function getCategoriesWithCount() {
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}
