import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlatformFeeConfig {
  id: string;
  fee_rate: number;
  flat_fee_amount: number;
  fee_name: string;
  description: string | null;
}

/**
 * Hook to fetch the current active platform fee configuration
 * Returns the standard platform fee rate for display and calculation purposes
 */
export const usePlatformFee = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-fee'],
    queryFn: async () => {
      // Fetch the active standard platform fee
      const { data, error } = await supabase
        .from('platform_fee_config')
        .select('id, fee_rate, flat_fee_amount, fee_name, description')
        .eq('is_active', true)
        .eq('fee_type', 'standard')
        .is('seller_id', null)
        .is('category_id', null)
        .lte('valid_from', new Date().toISOString())
        .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
        .order('priority', { ascending: false })
        .order('valid_from', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching platform fee:', error);
        // Fallback to default 10% if query fails
        return {
          id: 'default',
          fee_rate: 0.1,
          flat_fee_amount: 0,
          fee_name: 'Standard Platform Fee',
          description: 'Default platform commission',
        } as PlatformFeeConfig;
      }

      return data as PlatformFeeConfig;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    // Fallback to default fee on error
    placeholderData: {
      id: 'default',
      fee_rate: 0.1,
      flat_fee_amount: 0,
      fee_name: 'Standard Platform Fee',
      description: 'Default platform commission',
    },
  });

  return {
    feeRate: data?.fee_rate || 0.1,
    flatFee: data?.flat_fee_amount || 0,
    feeName: data?.fee_name || 'Standard Platform Fee',
    description: data?.description,
    isLoading,
    error,
  };
};
