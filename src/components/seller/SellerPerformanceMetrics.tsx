import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Package, 
  Clock, 
  DollarSign,
  Eye,
  Heart,
  ShoppingCart,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PerformanceMetrics {
  totalSales: number;
  salesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  averageRating: number;
  reviewCount: number;
  responseTime: number;
  fulfillmentRate: number;
  totalViews: number;
  viewsGrowth: number;
  conversionRate: number;
  favoriteCount: number;
  messageResponseRate: number;
}

export function SellerPerformanceMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      // Get sales data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Current period sales
      const { data: currentSales } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', user?.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed');

      // Previous period sales
      const { data: previousSales } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', user?.id)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed');

      const currentTotal = currentSales?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const previousTotal = previousSales?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const salesGrowth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

      // Get order counts
      const { count: currentOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: previousOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const ordersGrowth = previousOrders && previousOrders > 0 
        ? (((currentOrders || 0) - previousOrders) / previousOrders) * 100 
        : 0;

      // Get review metrics
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', user?.id)
        .eq('status', 'approved');

      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Get listing views
      const { data: listings } = await supabase
        .from('listings')
        .select('id, view_count')
        .eq('seller_id', user?.id);

      const totalViews = listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;

      // Get favorites
      const { count: favoriteCount } = await supabase
        .from('listing_favorites')
        .select('*', { count: 'exact', head: true })
        .in('listing_id', listings?.map(l => l.id) || []);

      // Calculate conversion rate (orders / views)
      const conversionRate = totalViews > 0 ? ((currentOrders || 0) / totalViews) * 100 : 0;

      // Get fulfillment rate
      const { count: totalCompletedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id)
        .in('status', ['completed', 'delivered']);

      const { count: totalAllOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id);

      const fulfillmentRate = totalAllOrders && totalAllOrders > 0
        ? ((totalCompletedOrders || 0) / totalAllOrders) * 100
        : 100;

      setMetrics({
        totalSales: currentTotal,
        salesGrowth,
        totalOrders: currentOrders || 0,
        ordersGrowth,
        averageRating,
        reviewCount: reviews?.length || 0,
        responseTime: 2.4, // Mock data - would need message tracking
        fulfillmentRate,
        totalViews,
        viewsGrowth: 15, // Mock data - would need historical tracking
        conversionRate,
        favoriteCount: favoriteCount || 0,
        messageResponseRate: 95 // Mock data - would need message tracking
      });
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="pt-6">Loading metrics...</CardContent></Card>;
  }

  if (!metrics) {
    return null;
  }

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: any; 
    trend?: 'up' | 'down'; 
    trendValue?: number;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trendValue !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Performance Metrics</h2>
        <p className="text-muted-foreground">Your shop's performance over the last 30 days</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sales"
          value={`$${metrics.totalSales.toFixed(2)}`}
          subtitle="Last 30 days"
          icon={DollarSign}
          trend={metrics.salesGrowth >= 0 ? 'up' : 'down'}
          trendValue={metrics.salesGrowth}
        />
        
        <MetricCard
          title="Orders"
          value={metrics.totalOrders}
          subtitle="Last 30 days"
          icon={Package}
          trend={metrics.ordersGrowth >= 0 ? 'up' : 'down'}
          trendValue={metrics.ordersGrowth}
        />

        <MetricCard
          title="Average Rating"
          value={metrics.averageRating.toFixed(1)}
          subtitle={`${metrics.reviewCount} reviews`}
          icon={Star}
        />

        <MetricCard
          title="Total Views"
          value={metrics.totalViews}
          subtitle="All listings"
          icon={Eye}
          trend="up"
          trendValue={metrics.viewsGrowth}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop Health</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fulfillment Rate</span>
                <span className="text-sm text-muted-foreground">{metrics.fulfillmentRate.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.fulfillmentRate} />
              {metrics.fulfillmentRate < 90 && (
                <p className="text-xs text-amber-600 mt-1">Below recommended 90%</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-sm text-muted-foreground">{metrics.conversionRate.toFixed(2)}%</span>
              </div>
              <Progress value={Math.min(metrics.conversionRate * 10, 100)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Message Response Rate</span>
                <span className="text-sm text-muted-foreground">{metrics.messageResponseRate}%</span>
              </div>
              <Progress value={metrics.messageResponseRate} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
            <CardDescription>Additional insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Favorites</span>
              </div>
              <span className="text-sm font-medium">{metrics.favoriteCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Avg Response Time</span>
              </div>
              <span className="text-sm font-medium">{metrics.responseTime}h</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">View to Order Rate</span>
              </div>
              <Badge variant="secondary">{metrics.conversionRate.toFixed(1)}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
