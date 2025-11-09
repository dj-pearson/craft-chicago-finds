import { AnalyticsProvider } from '@/components/analytics';
import { AdminAnalyticsDashboard } from '@/components/analytics/AdminAnalyticsDashboard';
import { PerformanceInsights } from '@/components/analytics/PerformanceInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';

export function AnalyticsDashboard() {
  return (
    <AnalyticsProvider>
      <div className="space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Platform Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <AdminAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="insights" className="mt-6">
            <PerformanceInsights userType="admin" />
          </TabsContent>
        </Tabs>
      </div>
    </AnalyticsProvider>
  );
}