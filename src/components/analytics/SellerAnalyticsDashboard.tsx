import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Eye, Star, TrendingUp, Users } from 'lucide-react';

export function SellerAnalyticsDashboard() {
  const { sellerMetrics, loading, fetchSellerMetrics } = useAnalytics();

  useEffect(() => {
    fetchSellerMetrics();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!sellerMetrics) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Seller Analytics</h2>
        <p className="text-muted-foreground">Track your sales performance and customer insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellerMetrics.totalSales}</div>
            <Badge variant="secondary" className="mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${sellerMetrics.totalRevenue.toFixed(2)}</div>
            <Badge variant="secondary" className="mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellerMetrics.totalViews}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {sellerMetrics.conversionRate.toFixed(1)}% conversion
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellerMetrics.averageRating.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {sellerMetrics.totalReviews} reviews
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sellerMetrics.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [value, name === 'sales' ? 'Sales' : 'Revenue ($)']}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="sales"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                name="revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sellerMetrics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium truncate">{product.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{product.sales} sales</span>
                      <span>${product.revenue} revenue</span>
                      <span>{product.views} views</span>
                    </div>
                  </div>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Top Cities</h4>
              {sellerMetrics.customerDemographics.topCities.map((city) => (
                <div key={city.city} className="flex items-center justify-between mb-2">
                  <span>{city.city}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(city.count / sellerMetrics.customerDemographics.topCities[0].count) * 100} 
                      className="w-20" 
                    />
                    <span className="text-sm text-muted-foreground">{city.count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Repeat Customers</span>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{sellerMetrics.customerDemographics.repeatCustomers}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {((sellerMetrics.customerDemographics.repeatCustomers / sellerMetrics.totalSales) * 100).toFixed(1)}% of total customers
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}