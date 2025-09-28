import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign,
  Eye,
  MessageSquare,
  Calendar
} from "lucide-react";

interface AnalyticsData {
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeSellers: number;
  totalViews: number;
  totalMessages: number;
  listingsByCategory: { name: string; count: number }[];
  ordersByStatus: { status: string; count: number; color: string }[];
  monthlyTrends: { month: string; listings: number; orders: number; revenue: number }[];
  cityStats: { city: string; listings: number; users: number; orders: number }[];
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [dateRange, setDateRange] = useState<string>("30");

  const fetchAnalytics = async () => {
    try {
      // Fetch basic metrics
      const [
        listingsResponse,
        ordersResponse,
        usersResponse,
        viewsResponse,
        messagesResponse,
        categoriesResponse,
        citiesResponse
      ] = await Promise.all([
        // Listings
        supabase
          .from('listings')
          .select('id, status, price, category_id, city_id, created_at'),
        
        // Orders
        supabase
          .from('orders')
          .select('id, status, total_amount, created_at'),
        
        // Users
        supabase
          .from('profiles')
          .select('id, user_id, is_seller, created_at, city_id'),
        
        // Listing analytics
        supabase
          .from('listing_analytics')
          .select('listing_id, event_type, created_at'),
        
        // Messages
        supabase
          .from('messages')
          .select('id, created_at'),
        
        // Categories
        supabase
          .from('categories')
          .select('id, name'),
        
        // Cities
        supabase
          .from('cities')
          .select('id, name')
          .eq('is_active', true)
      ]);

      const listings = listingsResponse.data || [];
      const orders = ordersResponse.data || [];
      const users = usersResponse.data || [];
      const views = viewsResponse.data || [];
      const messages = messagesResponse.data || [];
      const categories = categoriesResponse.data || [];
      
      setCities(citiesResponse.data || []);

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(String(order.total_amount || 0)), 0);
      const activeSellers = users.filter(u => u.is_seller).length;
      const totalViews = views.filter(v => v.event_type === 'view').length;

      // Listings by category
      const listingsByCategory = categories.map(cat => ({
        name: cat.name,
        count: listings.filter(l => l.category_id === cat.id).length
      })).filter(item => item.count > 0);

      // Orders by status
      const orderStatusMap: Record<string, string> = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        shipped: '#8b5cf6',
        delivered: '#10b981',
        cancelled: '#ef4444'
      };

      const ordersByStatus = Object.entries(
        orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: orderStatusMap[status] || '#6b7280'
      }));

      // Monthly trends (last 6 months)
      const now = new Date();
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const month = date.toLocaleString('default', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthListings = listings.filter(l => {
          const created = new Date(l.created_at);
          return created >= monthStart && created <= monthEnd;
        });
        
        const monthOrders = orders.filter(o => {
          const created = new Date(o.created_at);
          return created >= monthStart && created <= monthEnd;
        });
        
        const monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(String(order.total_amount || 0)), 0);
        
        return {
          month,
          listings: monthListings.length,
          orders: monthOrders.length,
          revenue: monthRevenue
        };
      });

      // City stats
      const cityStats = cities.map(city => ({
        city: city.name,
        listings: listings.filter(l => l.city_id === city.id).length,
        users: users.filter(u => u.city_id === city.id).length,
        orders: orders.length // Orders don't have direct city relation, would need join with listings
      }));

      setAnalytics({
        totalListings: listings.length,
        activeListings: listings.filter(l => l.status === 'active').length,
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: users.length,
        activeSellers,
        totalViews,
        totalMessages: messages.length,
        listingsByCategory,
        ordersByStatus,
        monthlyTrends,
        cityStats
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCity, dateRange]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor marketplace performance across cities</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(city => (
                <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalListings}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {analytics.activeListings} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              ${analytics.totalRevenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeSellers} sellers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalMessages} messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Listings and orders over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="listings" stroke="#3b82f6" name="Listings" />
                <Line type="monotone" dataKey="orders" stroke="#10b981" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                >
                  {analytics.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Listings by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Listings by Category</CardTitle>
            <CardDescription>Popular product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.listingsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* City Performance */}
        <Card>
          <CardHeader>
            <CardTitle>City Performance</CardTitle>
            <CardDescription>Metrics by city</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.cityStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="listings" fill="#3b82f6" name="Listings" />
                <Bar dataKey="users" fill="#10b981" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};