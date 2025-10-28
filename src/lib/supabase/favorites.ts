/**
 * Favorites/Wishlist operations
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get user's favorite products
 */
export async function getFavorites() {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, products(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add product to favorites
 */
export async function addToFavorites(productId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('favorites')
    .insert([{ product_id: productId, user_id: user.id }])
    .select('*, products(*)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove product from favorites
 */
export async function removeFromFavorites(productId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('product_id', productId);

  if (error) throw error;
}

/**
 * Check if product is in favorites
 */
export async function isInFavorites(productId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(productId: string) {
  const isFavorite = await isInFavorites(productId);
  
  if (isFavorite) {
    await removeFromFavorites(productId);
    return false;
  } else {
    await addToFavorites(productId);
    return true;
  }
}
