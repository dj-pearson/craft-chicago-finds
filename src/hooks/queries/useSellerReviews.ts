import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SellerReviewStats {
  averageRating: number;
  reviewCount: number;
}

export const useSellerReviews = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['sellerReviews', sellerId],
    queryFn: async (): Promise<SellerReviewStats | null> => {
      if (!sellerId) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', sellerId);

      if (error) {
        console.error('Error fetching seller reviews:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / data.length;

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: data.length,
      };
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
