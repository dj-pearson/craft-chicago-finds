import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Eye, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Package
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AnalyticsData {
  views_over_time: Array<{ date: string; views: number }>;
  orders_over_time: Array<{ date: string; orders: number; revenue: number }>;
  popular_listings: Array<{ title: string; views: number; orders: number }>;
  category_performance: Array<{ category: string; listings: number; views: number }>;
}

export const SellerAnalytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch analytics data from listing_analytics table
      const { data: analyticsEvents, error: analyticsError } = await supabase
        .from('listing_analytics')
        .select(`
          created_at,
          event_type,
          listing_id,
          listings (
            title,
            category_id,
            categories (
              name
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('listing_id', 
          await supabase
            .from('listings')
            .select('id')
            .eq('seller_id', user.id)
            .then(({ data }) => data?.map(l => l.id) || [])
        );

      if (analyticsError) throw analyticsError;

      // Fetch orders data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('created_at, total_amount, listing_id, listings(title)')
        .eq('seller_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Process analytics data
      const processedData = processAnalyticsData(analyticsEvents || [], ordersData || []);
      setAnalyticsData(processedData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (analyticsEvents: any[], ordersData: any[]): AnalyticsData => {
    // Group events by date for views over time
    const viewsByDate: { [key: string]: number } = {};
    analyticsEvents
      .filter(event => event.event_type === 'view')
      .forEach(event => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        viewsByDate[date] = (viewsByDate[date] || 0) + 1;
      });

    const views_over_time = Object.entries(viewsByDate)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group orders by date
    const ordersByDate: { [key: string]: { orders: number; revenue: number } } = {};
    ordersData.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { orders: 0, revenue: 0 };
      }
      ordersByDate[date].orders += 1;
      ordersByDate[date].revenue += parseFloat(order.total_amount || '0');
    });

    const orders_over_time = Object.entries(ordersByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get popular listings
    const listingStats: { [key: string]: { title: string; views: number; orders: number } } = {};
    
    analyticsEvents
      .filter(event => event.event_type === 'view')
      .forEach(event => {
        const listingId = event.listing_id;
        const title = event.listings?.title || 'Unknown Listing';
        if (!listingStats[listingId]) {
          listingStats[listingId] = { title, views: 0, orders: 0 };
        }
        listingStats[listingId].views += 1;
      });

    ordersData.forEach(order => {
      const listingId = order.listing_id;
      const title = order.listings?.title || 'Unknown Listing';
      if (!listingStats[listingId]) {
        listingStats[listingId] = { title, views: 0, orders: 0 };
      }
      listingStats[listingId].orders += 1;
    });

    const popular_listings = Object.values(listingStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Category performance
    const categoryStats: { [key: string]: { listings: Set<string>; views: number } } = {};
    
    analyticsEvents
      .filter(event => event.event_type === 'view')
      .forEach(event => {
        const categoryName = event.listings?.categories?.name || 'Uncategorized';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { listings: new Set(), views: 0 };
        }
        categoryStats[categoryName].listings.add(event.listing_id);
        categoryStats[categoryName].views += 1;
      });

    const category_performance = Object.entries(categoryStats)
      .map(([category, data]) => ({
        category,
        listings: data.listings.size,
        views: data.views
      }))
      .sort((a, b) => b.views - a.views);

    return {
      views_over_time,
      orders_over_time,
      popular_listings,
      category_performance
    };
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <div className="w-32 h-9 bg-muted rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Analytics
        </h2>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!analyticsData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
            <p className="text-muted-foreground text-center">
              Analytics data will appear here once your listings start receiving views and orders.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Views Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analyticsData.views_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders & Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.orders_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Popular Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.popular_listings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No listings data yet</p>
                ) : (
                  analyticsData.popular_listings.map((listing, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {listing.views} views • {listing.orders} orders
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.category_performance.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No category data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analyticsData.category_performance}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="views"
                      label={({ category, percent }: any) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {analyticsData.category_performance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};