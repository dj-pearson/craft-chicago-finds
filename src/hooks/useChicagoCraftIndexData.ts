import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KeyMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface TrendingCategory {
  name: string;
  change: number;
  trend: 'up' | 'down';
  avgPrice: number;
  searches: number;
}

interface NeighborhoodData {
  name: string;
  pickups: number;
  avgOrderValue: number;
  topCategory: string;
}

interface SeasonalInsight {
  month: string;
  topCategory: string;
  avgPrice: number;
  seasonalNote: string;
}

interface IndexData {
  keyMetrics: KeyMetric[];
  trendingCategories: TrendingCategory[];
  neighborhoodData: NeighborhoodData[];
  seasonalInsights: SeasonalInsight[];
  lastUpdated: Date;
}

export const useChicagoCraftIndexData = () => {
  return useQuery({
    queryKey: ['chicago-craft-index'],
    queryFn: async (): Promise<IndexData> => {
      // Get current date for calculations
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Dynamically fetch Chicago city ID
      const { data: chicagoCity, error: cityError } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', 'chicago')
        .single();

      const chicagoCityId = chicagoCity?.id || null;

      // Query 1: Active Makers Count
      const { count: makersCount, error: makersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_seller', true)
        .eq('seller_verified', true);

      if (makersError) throw makersError;

      // Query 2: Total Active Listings Count
      const { count: listingsCount, error: listingsError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (listingsError) throw listingsError;

      // Query 3: Average Item Price
      const { data: priceData, error: priceError } = await supabase
        .from('listings')
        .select('price')
        .eq('status', 'active');

      if (priceError) throw priceError;

      const avgPrice = priceData && priceData.length > 0
        ? priceData.reduce((sum, item) => sum + Number(item.price || 0), 0) / priceData.length
        : 0;

      // Query 4: Same-Day Pickup Rate
      const { data: pickupOrders, error: pickupError } = await supabase
        .from('orders')
        .select('id, fulfillment_method')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (pickupError) throw pickupError;

      const totalOrders = pickupOrders?.length || 0;
      const pickupOrdersCount = pickupOrders?.filter(o => o.fulfillment_method === 'local_pickup').length || 0;
      const pickupRate = totalOrders > 0 ? (pickupOrdersCount / totalOrders) * 100 : 38; // fallback to 38%

      // Query 5: Trending Categories (using the optimized function)
      // Only call RPC if we have a valid city ID
      let trendingCats: any[] = [];
      let trendingError: any = null;

      if (chicagoCityId) {
        const result = await supabase
          .rpc('get_trending_categories', {
            p_city_id: chicagoCityId,
            p_limit: 6
          });
        trendingCats = result.data || [];
        trendingError = result.error;
      }

      if (trendingError) {
        console.error('Error fetching trending categories:', trendingError);
      }

      // Transform trending categories data
      const trendingCategories: TrendingCategory[] = (trendingCats || []).map((cat: any) => ({
        name: cat.category_name,
        change: Math.round(cat.growth_rate || 0),
        trend: (cat.growth_rate || 0) >= 0 ? 'up' as const : 'down' as const,
        avgPrice: cat.average_price || avgPrice,
        searches: cat.view_count || 0
      }));

      // Query 6: Neighborhood Data (group orders by seller city/neighborhood)
      const { data: neighborhoodOrders, error: neighborhoodError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          fulfillment_method,
          listings!inner(
            id,
            category,
            seller_profiles!inner(
              id,
              business_address,
              city_id,
              profiles!inner(
                city_id,
                cities(name)
              )
            )
          )
        `)
        .eq('fulfillment_method', 'local_pickup')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (neighborhoodError) {
        console.error('Error fetching neighborhood data:', neighborhoodError);
      }

      // Aggregate neighborhood data
      const neighborhoodMap = new Map<string, {
        pickups: number;
        totalValue: number;
        categories: Map<string, number>;
      }>();

      (neighborhoodOrders || []).forEach((order: any) => {
        // Extract neighborhood from business address or use city name
        const neighborhood = order.listings?.seller_profiles?.business_address?.split(',')[0] ||
                            order.listings?.seller_profiles?.profiles?.cities?.name ||
                            'Unknown';

        if (!neighborhoodMap.has(neighborhood)) {
          neighborhoodMap.set(neighborhood, {
            pickups: 0,
            totalValue: 0,
            categories: new Map()
          });
        }

        const data = neighborhoodMap.get(neighborhood)!;
        data.pickups++;
        data.totalValue += Number(order.total_amount || 0);

        const category = order.listings?.category || 'Other';
        data.categories.set(category, (data.categories.get(category) || 0) + 1);
      });

      const neighborhoodData: NeighborhoodData[] = Array.from(neighborhoodMap.entries())
        .map(([name, data]) => {
          const topCategoryEntry = Array.from(data.categories.entries())
            .sort((a, b) => b[1] - a[1])[0];

          return {
            name,
            pickups: data.pickups,
            avgOrderValue: data.pickups > 0 ? Math.round(data.totalValue / data.pickups) : 0,
            topCategory: topCategoryEntry ? topCategoryEntry[0] : 'Unknown'
          };
        })
        .sort((a, b) => b.pickups - a.pickups)
        .slice(0, 5);

      // If no neighborhood data available, show empty state (no fake data)
      // The component will handle showing an appropriate message

      // Query 7: Seasonal Insights (last 6 months of data)
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const { data: seasonalData, error: seasonalError } = await supabase
        .from('orders')
        .select(`
          created_at,
          total_amount,
          listings!inner(category, price)
        `)
        .gte('created_at', sixMonthsAgo.toISOString());

      if (seasonalError) {
        console.error('Error fetching seasonal data:', seasonalError);
      }

      // Aggregate by month
      const monthlyData = new Map<string, {
        categories: Map<string, number>;
        prices: number[];
      }>();

      (seasonalData || []).forEach((order: any) => {
        const month = new Date(order.created_at).toLocaleString('default', { month: 'long' });

        if (!monthlyData.has(month)) {
          monthlyData.set(month, {
            categories: new Map(),
            prices: []
          });
        }

        const data = monthlyData.get(month)!;
        const category = order.listings?.category || 'Other';
        data.categories.set(category, (data.categories.get(category) || 0) + 1);

        if (order.listings?.price) {
          data.prices.push(Number(order.listings.price));
        }
      });

      const seasonalInsights: SeasonalInsight[] = Array.from(monthlyData.entries())
        .map(([month, data]) => {
          const topCategory = Array.from(data.categories.entries())
            .sort((a, b) => b[1] - a[1])[0];

          const avgMonthPrice = data.prices.length > 0
            ? data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length
            : avgPrice;

          // Seasonal notes based on patterns
          let seasonalNote = "";
          if (month === "November" || month === "December") {
            seasonalNote = "Holiday gift surge";
          } else if (month === "May" || month === "June") {
            seasonalNote = "Wedding season boost";
          } else if (month === "February") {
            seasonalNote = "Valentine's Day peak";
          } else {
            seasonalNote = "Steady demand";
          }

          return {
            month,
            topCategory: topCategory ? topCategory[0] : 'Unknown',
            avgPrice: Math.round(avgMonthPrice),
            seasonalNote
          };
        })
        .slice(0, 6);

      // Calculate month-over-month changes for key metrics
      const { count: makersPrevious } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_seller', true)
        .eq('seller_verified', true)
        .lte('created_at', thirtyDaysAgo.toISOString());

      const { count: listingsPrevious } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('created_at', thirtyDaysAgo.toISOString());

      const makersChange = makersPrevious && makersPrevious > 0
        ? Math.round(((makersCount || 0) - makersPrevious) / makersPrevious * 100)
        : 0;

      const listingsChange = listingsPrevious && listingsPrevious > 0
        ? Math.round(((listingsCount || 0) - listingsPrevious) / listingsPrevious * 100)
        : 0;

      // Build key metrics from real data only
      const keyMetrics: KeyMetric[] = [
        {
          label: "Active Makers",
          value: (makersCount || 0).toString(),
          change: makersChange ? `${makersChange > 0 ? '+' : ''}${makersChange}% this month` : 'No prior data',
          trend: makersChange > 0 ? 'up' : makersChange < 0 ? 'down' : 'neutral'
        },
        {
          label: "Total Listings",
          value: listingsCount ? `${Math.floor(listingsCount / 100) * 100}+` : '0',
          change: listingsChange ? `${listingsChange > 0 ? '+' : ''}${listingsChange}% this month` : 'No prior data',
          trend: listingsChange > 0 ? 'up' : listingsChange < 0 ? 'down' : 'neutral'
        },
        {
          label: "Avg Item Price",
          value: avgPrice > 0 ? `$${Math.round(avgPrice)}` : 'N/A',
          change: "Based on active listings",
          trend: 'neutral'
        },
        {
          label: "Same-Day Pickups",
          value: totalOrders > 0 ? `${Math.round(pickupRate)}%` : 'N/A',
          change: totalOrders > 0 ? "of all orders" : "No orders yet",
          trend: 'neutral'
        }
      ];

      return {
        keyMetrics,
        trendingCategories,
        neighborhoodData,
        seasonalInsights,
        lastUpdated: now
      };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};
