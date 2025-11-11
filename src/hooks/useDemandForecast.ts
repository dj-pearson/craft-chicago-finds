import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryForecast {
  category: string;
  currentDemand: number;
  predictedDemand: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: 'high' | 'medium' | 'low';
  seasonalPattern: string;
  recommendation: string;
  historicalData: {
    month: string;
    orders: number;
  }[];
}

interface DemandForecastData {
  sellerCategories: CategoryForecast[];
  upcomingEvents: {
    event: string;
    date: string;
    categories: string[];
    expectedSurge: string;
  }[];
  inventoryRecommendations: {
    action: 'increase' | 'maintain' | 'decrease';
    category: string;
    reason: string;
    urgency: 'high' | 'medium' | 'low';
  }[];
}

export const useDemandForecast = (sellerId: string) => {
  return useQuery({
    queryKey: ['demand-forecast', sellerId],
    queryFn: async (): Promise<DemandForecastData> => {
      if (!sellerId) throw new Error('Seller ID required');

      // Get seller's categories from their listings
      const { data: sellerListings, error: listingsError } = await supabase
        .from('listings')
        .select('category')
        .eq('seller_id', sellerId)
        .eq('status', 'active');

      if (listingsError) throw listingsError;

      const sellerCategories = [...new Set(sellerListings?.map(l => l.category).filter(Boolean))];

      // Get historical order data for the past 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: historicalOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          listings!inner(category)
        `)
        .gte('created_at', twelveMonthsAgo.toISOString());

      if (ordersError) throw ordersError;

      // Analyze demand patterns by category
      const categoryForecasts: CategoryForecast[] = [];

      for (const category of sellerCategories) {
        // Filter orders for this category
        const categoryOrders = (historicalOrders || []).filter(
          (order: any) => order.listings?.category === category
        );

        // Group by month
        const monthlyData = new Map<string, number>();
        categoryOrders.forEach((order: any) => {
          const month = new Date(order.created_at).toLocaleString('default', { month: 'long' });
          monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
        });

        // Get last 6 months of data
        const historicalData = Array.from(monthlyData.entries())
          .map(([month, orders]) => ({ month, orders }))
          .slice(-6);

        // Calculate current demand (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentOrders = categoryOrders.filter(
          (order: any) => new Date(order.created_at) >= thirtyDaysAgo
        ).length;

        // Calculate trend (compare last 30 days to previous 30 days)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const previousPeriodOrders = categoryOrders.filter(
          (order: any) => {
            const orderDate = new Date(order.created_at);
            return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
          }
        ).length;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let predictedDemand = recentOrders;

        if (recentOrders > previousPeriodOrders * 1.2) {
          trend = 'increasing';
          predictedDemand = Math.round(recentOrders * 1.3);
        } else if (recentOrders < previousPeriodOrders * 0.8) {
          trend = 'decreasing';
          predictedDemand = Math.round(recentOrders * 0.8);
        } else {
          predictedDemand = recentOrders;
        }

        // Determine seasonal pattern
        const currentMonth = new Date().getMonth();
        let seasonalPattern = "Steady year-round";
        let recommendation = "Maintain current inventory levels";

        // Holiday season (Oct-Dec)
        if (currentMonth >= 9 && currentMonth <= 11) {
          seasonalPattern = "Holiday surge season";
          recommendation = "Increase inventory 2-3x for gift-buying season";
          predictedDemand = Math.round(predictedDemand * 2.5);
        }
        // Valentine's (Jan-Feb)
        else if (currentMonth === 0 || currentMonth === 1) {
          if (category.toLowerCase().includes('jewelry') ||
              category.toLowerCase().includes('candle') ||
              category.toLowerCase().includes('chocolate')) {
            seasonalPattern = "Valentine's Day peak";
            recommendation = "Stock romantic items - jewelry, candles, gift sets";
            predictedDemand = Math.round(predictedDemand * 1.8);
          }
        }
        // Spring/Wedding Season (Apr-Jun)
        else if (currentMonth >= 3 && currentMonth <= 5) {
          if (category.toLowerCase().includes('jewelry') ||
              category.toLowerCase().includes('decor') ||
              category.toLowerCase().includes('gift')) {
            seasonalPattern = "Wedding & graduation season";
            recommendation = "Focus on gifts and wedding-related items";
            predictedDemand = Math.round(predictedDemand * 1.5);
          }
        }

        // Confidence based on data volume
        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (categoryOrders.length > 50) confidence = 'high';
        else if (categoryOrders.length > 20) confidence = 'medium';

        categoryForecasts.push({
          category,
          currentDemand: recentOrders,
          predictedDemand,
          trend,
          confidence,
          seasonalPattern,
          recommendation,
          historicalData
        });
      }

      // Upcoming events (static for now, could be dynamic)
      const currentMonth = new Date().getMonth();
      const upcomingEvents = [];

      if (currentMonth === 9) { // October
        upcomingEvents.push({
          event: "Halloween",
          date: "October 31",
          categories: ["Home Decor", "Candles", "Art"],
          expectedSurge: "2.5x normal demand"
        });
      }

      if (currentMonth >= 9) { // Oct-Dec
        upcomingEvents.push({
          event: "Holiday Shopping Season",
          date: "November - December",
          categories: ["Jewelry", "Home Decor", "Gift Sets", "Candles"],
          expectedSurge: "3x normal demand"
        });
      }

      if (currentMonth === 0 || currentMonth === 11) { // Jan or Dec
        upcomingEvents.push({
          event: "Valentine's Day",
          date: "February 14",
          categories: ["Jewelry", "Candles", "Art", "Chocolates"],
          expectedSurge: "2x normal demand"
        });
      }

      if (currentMonth >= 2 && currentMonth <= 4) { // Mar-May
        upcomingEvents.push({
          event: "Mother's Day",
          date: "May (2nd Sunday)",
          categories: ["Jewelry", "Home Decor", "Candles", "Art"],
          expectedSurge: "2.5x normal demand"
        });
        upcomingEvents.push({
          event: "Wedding Season",
          date: "May - June",
          categories: ["Jewelry", "Home Decor", "Gifts"],
          expectedSurge: "1.8x normal demand"
        });
      }

      // Generate inventory recommendations
      const inventoryRecommendations = categoryForecasts
        .map(forecast => {
          if (forecast.trend === 'increasing' && forecast.confidence !== 'low') {
            return {
              action: 'increase' as const,
              category: forecast.category,
              reason: `Demand trending up ${Math.round((forecast.predictedDemand / forecast.currentDemand - 1) * 100)}%. ${forecast.seasonalPattern}.`,
              urgency: forecast.confidence === 'high' ? 'high' as const : 'medium' as const
            };
          }

          if (forecast.trend === 'decreasing') {
            return {
              action: 'decrease' as const,
              category: forecast.category,
              reason: `Demand declining. Consider reducing inventory or running promotions.`,
              urgency: 'low' as const
            };
          }

          if (forecast.predictedDemand > forecast.currentDemand * 1.5) {
            return {
              action: 'increase' as const,
              category: forecast.category,
              reason: forecast.seasonalPattern,
              urgency: 'high' as const
            };
          }

          return {
            action: 'maintain' as const,
            category: forecast.category,
            reason: `Stable demand. Current inventory levels appropriate.`,
            urgency: 'low' as const
          };
        })
        .filter(rec => rec.action !== 'maintain') // Only show actionable recommendations
        .sort((a, b) => {
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        });

      return {
        sellerCategories: categoryForecasts,
        upcomingEvents,
        inventoryRecommendations
      };
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 60, // 1 hour
    cacheTime: 1000 * 60 * 120, // 2 hours
  });
};
