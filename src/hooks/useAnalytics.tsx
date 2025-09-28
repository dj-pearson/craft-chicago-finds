import { createContext, useContext, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface SellerMetrics {
  totalSales: number;
  totalRevenue: number;
  totalListings: number;
  totalViews: number;
  averageRating: number;
  totalReviews: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: number;
    views: number;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  customerDemographics: {
    topCities: Array<{ city: string; count: number }>;
    repeatCustomers: number;
  };
}

export interface AdminMetrics {
  totalUsers: number;
  totalSellers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: number;
  platformCommission: number;
  userGrowthRate: number;
  sellerGrowthRate: number;
  topCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  topCities: Array<{
    city: string;
    users: number;
    listings: number;
    revenue: number;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  userActivityTrend: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
  }>;
}

interface AnalyticsContextType {
  sellerMetrics: SellerMetrics | null;
  adminMetrics: AdminMetrics | null;
  loading: boolean;
  fetchSellerMetrics: () => Promise<void>;
  fetchAdminMetrics: () => Promise<void>;
  trackEvent: (eventType: string, data: any) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [sellerMetrics, setSellerMetrics] = useState<SellerMetrics | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSellerMetrics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch seller's orders for revenue and sales
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id);

      // Fetch seller's listings
      const { data: listings } = await supabase
        .from('listings')
        .select('*, listing_analytics(*)')
        .eq('seller_id', user.id);

      // Fetch seller's reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', user.id);

      // Calculate metrics
      const totalSales = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalListings = listings?.length || 0;
      const totalViews = listings?.reduce((sum, listing) => sum + (listing.view_count || 0), 0) || 0;
      const averageRating = reviews?.length 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;
      const totalReviews = reviews?.length || 0;
      const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

      // Create mock data for trends and demographics (in real app, this would come from proper analytics)
      const salesTrend = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 10),
        revenue: Math.floor(Math.random() * 1000),
      }));

      const topProducts = listings?.slice(0, 5).map(listing => ({
        id: listing.id,
        title: listing.title,
        sales: Math.floor(Math.random() * 20),
        revenue: Math.floor(Math.random() * 2000),
        views: listing.view_count || 0,
      })) || [];

      setSellerMetrics({
        totalSales,
        totalRevenue,
        totalListings,
        totalViews,
        averageRating,
        totalReviews,
        conversionRate,
        topProducts,
        salesTrend,
        customerDemographics: {
          topCities: [
            { city: 'Chicago', count: 15 },
            { city: 'Milwaukee', count: 8 },
            { city: 'Detroit', count: 5 },
          ],
          repeatCustomers: Math.floor(totalSales * 0.3),
        },
      });
    } catch (error) {
      console.error('Error fetching seller metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminMetrics = async () => {
    setLoading(true);
    try {
      // Fetch platform statistics
      const [
        { count: totalUsers },
        { count: totalSellers },
        { count: totalListings },
        { count: totalOrders }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_seller', true),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
      ]);

      // Fetch revenue data
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, commission_amount');

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const platformCommission = orders?.reduce((sum, order) => sum + Number(order.commission_amount), 0) || 0;

      // Mock data for trends and demographics
      const revenueTrend = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000),
        orders: Math.floor(Math.random() * 50),
      }));

      const userActivityTrend = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 200),
        newUsers: Math.floor(Math.random() * 20),
      }));

      setAdminMetrics({
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        totalListings: totalListings || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        platformCommission,
        userGrowthRate: 15.2,
        sellerGrowthRate: 8.7,
        topCategories: [
          { category: 'Handmade', count: 45, revenue: 12500 },
          { category: 'Art', count: 32, revenue: 8900 },
          { category: 'Food', count: 28, revenue: 6700 },
        ],
        topCities: [
          { city: 'Chicago', users: 156, listings: 89, revenue: 45000 },
          { city: 'Milwaukee', users: 87, listings: 52, revenue: 23000 },
          { city: 'Detroit', users: 64, listings: 38, revenue: 17000 },
        ],
        revenueTrend,
        userActivityTrend,
      });
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, data: any) => {
    try {
      await supabase
        .from('listing_analytics')
        .insert([{
          event_type: eventType,
          listing_id: data.listing_id,
          user_id: user?.id,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
        }]);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  return (
    <AnalyticsContext.Provider value={{
      sellerMetrics,
      adminMetrics,
      loading,
      fetchSellerMetrics,
      fetchAdminMetrics,
      trackEvent
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};