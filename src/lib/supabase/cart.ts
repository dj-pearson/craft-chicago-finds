/**
 * Shopping cart operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's cart items with product details
 */
export async function getCartItems() {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add item to cart
 */
export async function addToCart(productId: string, quantity = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if item already exists
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (existing) {
    // Update quantity
    return updateCartItemQuantity(existing.id, existing.quantity + quantity);
  }

  // Insert new item
  const { data, error } = await supabase
    .from('cart_items')
    .insert([{ product_id: productId, quantity, user_id: user.id }])
    .select('*, products(*)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select('*, products(*)')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) throw error;
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's items

  if (error) throw error;
}

/**
 * Get cart total
 */
export async function getCartTotal() {
  const items = await getCartItems();
  
  return items.reduce((total, item) => {
    return total + (item.products.price * item.quantity);
  }, 0);
}

/**
 * Get cart item count
 */
export async function getCartCount() {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}
