/**
 * Product CRUD operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  artisan_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  main_image_url: string | null;
  images: string[];
  is_active: boolean;
  featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category_id?: string;
  search?: string;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  artisan_id?: string;
}

/**
 * Fetch products with optional filters
 */
export async function getProducts(filters: ProductFilters = {}) {
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

  if (filters.artisan_id) {
    query = query.eq('artisan_id', filters.artisan_id);
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

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch single product by ID or slug
 */
export async function getProduct(idOrSlug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug), profiles(display_name, avatar_url, city)')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('featured', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categorySlug: string) {
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (categoryError) throw categoryError;

  return getProducts({ category_id: category.id });
}

/**
 * Search products
 */
export async function searchProducts(searchTerm: string) {
  return getProducts({ search: searchTerm });
}
