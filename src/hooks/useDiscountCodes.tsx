import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type {
  DiscountCode,
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  ValidateDiscountCodeResponse,
  DiscountCodeStats,
} from '@/types/discount';

export function useDiscountCodes() {
  const { user } = useAuth();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DiscountCodeStats | null>(null);

  // Fetch vendor's discount codes
  const fetchDiscountCodes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDiscountCodes(data || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast.error('Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor discount code statistics
  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_vendor_discount_stats', {
        p_seller_id: user.id,
      });

      if (error) throw error;

      setStats(data as DiscountCodeStats);
    } catch (error) {
      console.error('Error fetching discount stats:', error);
    }
  };

  // Create new discount code
  const createDiscountCode = async (input: CreateDiscountCodeInput) => {
    if (!user) {
      toast.error('You must be logged in to create discount codes');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .insert({
          ...input,
          code: input.code.toUpperCase(), // Always uppercase
          seller_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast.error('This discount code already exists');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Discount code created successfully');
      await fetchDiscountCodes();
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Error creating discount code:', error);
      toast.error('Failed to create discount code');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update existing discount code
  const updateDiscountCode = async (input: UpdateDiscountCodeInput) => {
    if (!user) {
      toast.error('You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      const { id, ...updates } = input;

      // Uppercase code if being updated
      if (updates.code) {
        updates.code = updates.code.toUpperCase();
      }

      const { error } = await supabase
        .from('discount_codes')
        .update(updates)
        .eq('id', id)
        .eq('seller_id', user.id); // Ensure user owns this code

      if (error) {
        if (error.code === '23505') {
          toast.error('This discount code already exists');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('Discount code updated successfully');
      await fetchDiscountCodes();
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Error updating discount code:', error);
      toast.error('Failed to update discount code');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete discount code
  const deleteDiscountCode = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)
        .eq('seller_id', user.id);

      if (error) throw error;

      toast.success('Discount code deleted successfully');
      await fetchDiscountCodes();
      await fetchStats();
      return true;
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast.error('Failed to delete discount code');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle discount code active status
  const toggleDiscountCode = async (id: string, isActive: boolean) => {
    return updateDiscountCode({ id, is_active: isActive });
  };

  // Validate discount code for buyer (during checkout)
  const validateDiscountCode = async (
    code: string,
    sellerId: string,
    cartTotal: number
  ): Promise<ValidateDiscountCodeResponse> => {
    if (!user) {
      return {
        valid: false,
        error: 'You must be logged in to use discount codes',
      };
    }

    try {
      const { data, error } = await supabase.rpc('validate_discount_code', {
        p_code: code.toUpperCase(),
        p_user_id: user.id,
        p_seller_id: sellerId,
        p_cart_total: cartTotal,
      });

      if (error) throw error;

      return data as ValidateDiscountCodeResponse;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return {
        valid: false,
        error: 'Failed to validate discount code',
      };
    }
  };

  // Calculate discount amount
  const calculateDiscountAmount = async (
    discountType: string,
    discountValue: number,
    cartTotal: number,
    maxDiscount?: number
  ): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('calculate_discount_amount', {
        p_discount_type: discountType,
        p_discount_value: discountValue,
        p_cart_total: cartTotal,
        p_max_discount: maxDiscount || null,
      });

      if (error) throw error;

      return data as number;
    } catch (error) {
      console.error('Error calculating discount:', error);
      return 0;
    }
  };

  // Load discount codes on mount
  useEffect(() => {
    if (user) {
      fetchDiscountCodes();
      fetchStats();
    }
  }, [user?.id]);

  return {
    discountCodes,
    stats,
    loading,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    toggleDiscountCode,
    validateDiscountCode,
    calculateDiscountAmount,
    refreshDiscountCodes: fetchDiscountCodes,
    refreshStats: fetchStats,
  };
}
