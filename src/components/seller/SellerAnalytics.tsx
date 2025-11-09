import { AnalyticsProvider } from '@/components/analytics';
import { SellerAnalyticsDashboard } from '@/components/analytics/SellerAnalyticsDashboard';
import { PerformanceInsights } from '@/components/analytics/PerformanceInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';

export function SellerAnalytics() {
  return (
    <AnalyticsProvider>
      <div className="space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <SellerAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="insights" className="mt-6">
            <PerformanceInsights userType="seller" />
          </TabsContent>
        </Tabs>
      </div>
    </AnalyticsProvider>
  );
}