import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrendAlert {
  category: string;
  trendScore: number;
  growthRate: number;
  searchVolume: number;
  recommendation: string;
  urgency: 'high' | 'medium' | 'low';
  opportunity: string;
}

interface CategoryTrendAlertsData {
  trendingCategories: TrendAlert[];
  sellerHasTrendingItems: boolean;
  missedOpportunities: TrendAlert[];
}

export const useCategoryTrendAlerts = (sellerId: string) => {
  return useQuery({
    queryKey: ['category-trend-alerts', sellerId],
    queryFn: async (): Promise<CategoryTrendAlertsData> => {
      if (!sellerId) throw new Error('Seller ID required');

      // Get seller's current categories
      const { data: sellerListings, error: listingsError } = await supabase
        .from('listings')
        .select('category')
        .eq('seller_id', sellerId)
        .eq('status', 'active');

      if (listingsError) throw listingsError;

      const sellerCategories = [...new Set(sellerListings?.map(l => l.category).filter(Boolean))];

      // Get Chicago city ID (hardcoded for now, should be dynamic)
      const chicagoCityId = 'bf6e733a-52de-44c2-99f3-4d5c9f14e8c3';

      // Get trending categories using the optimized DB function
      const { data: trendingData, error: trendingError } = await supabase
        .rpc('get_trending_categories', {
          p_city_id: chicagoCityId,
          p_limit: 10
        });

      if (trendingError) {
        console.error('Error fetching trending categories:', trendingError);
      }

      const trendingCategories: TrendAlert[] = (trendingData || [])
        .filter((cat: any) => cat.growth_rate > 15) // Only categories with >15% growth
        .map((cat: any) => {
          const growthRate = cat.growth_rate || 0;
          const searchVolume = cat.view_count || 0;

          let urgency: 'high' | 'medium' | 'low' = 'low';
          if (growthRate > 50) urgency = 'high';
          else if (growthRate > 30) urgency = 'medium';

          let recommendation = '';
          let opportunity = '';

          if (growthRate > 50) {
            recommendation = `URGENT: ${cat.category_name} demand surging ${Math.round(growthRate)}%. Stock up heavily.`;
            opportunity = `High-demand window - buyers actively searching. Prioritize ${cat.category_name} listings.`;
          } else if (growthRate > 30) {
            recommendation = `${cat.category_name} trending up ${Math.round(growthRate)}%. Increase inventory.`;
            opportunity = `Growing interest - good time to expand ${cat.category_name} offerings.`;
          } else {
            recommendation = `${cat.category_name} showing ${Math.round(growthRate)}% growth. Monitor closely.`;
            opportunity = `Moderate growth - consider testing new ${cat.category_name} designs.`;
          }

          return {
            category: cat.category_name,
            trendScore: cat.view_count * (1 + growthRate / 100),
            growthRate,
            searchVolume,
            recommendation,
            urgency,
            opportunity
          };
        })
        .sort((a: TrendAlert, b: TrendAlert) => b.growthRate - a.growthRate);

      // Check if seller has any trending categories
      const sellerHasTrendingItems = trendingCategories.some((trend: TrendAlert) =>
        sellerCategories.some(sellerCat =>
          sellerCat?.toLowerCase() === trend.category.toLowerCase()
        )
      );

      // Find missed opportunities (trending categories seller doesn't have)
      const missedOpportunities = trendingCategories.filter((trend: TrendAlert) =>
        !sellerCategories.some(sellerCat =>
          sellerCat?.toLowerCase() === trend.category.toLowerCase()
        )
      ).slice(0, 5); // Top 5 missed opportunities

      return {
        trendingCategories: trendingCategories.filter((trend: TrendAlert) =>
          sellerCategories.some(sellerCat =>
            sellerCat?.toLowerCase() === trend.category.toLowerCase()
          )
        ),
        sellerHasTrendingItems,
        missedOpportunities
      };
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });
};
