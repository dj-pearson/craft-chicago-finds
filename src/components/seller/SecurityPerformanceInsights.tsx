import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Eye,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { useEnhancedPerformanceMonitor } from '@/hooks/useEnhancedPerformanceMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CacheMetrics {
  namespace: string;
  hit_rate: number;
  total_requests: number;
  avg_response_time: number;
  performance_score: number;
}

export const SecurityPerformanceInsights = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    trustScore, 
    getSecurityStatus, 
    recentSignals,
    isInitialized: fraudInitialized 
  } = useFraudDetection();
  
  const { 
    performanceScore, 
    isHealthy, 
    systemHealth,
    isInitialized: perfInitialized 
  } = useEnhancedPerformanceMonitor();

  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics[]>([]);
  const [sellerPerformance, setSellerPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && fraudInitialized && perfInitialized) {
      loadSellerInsights();
    }
  }, [user, fraudInitialized, perfInitialized]);

  const loadSellerInsights = async () => {
    try {
      await Promise.all([
        loadCacheMetrics(),
        loadSellerPerformanceMetrics()
      ]);
    } catch (error) {
      console.error('Failed to load seller insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCacheMetrics = async () => {
    try {
      // Get cache performance metrics for seller-relevant namespaces
      const { data, error } = await supabase
        .from('cache_performance_metrics')
        .select('*')
        .in('namespace', ['listings', 'profiles', 'search'])
        .gte('period_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('period_start', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (data) {
        const metrics: CacheMetrics[] = data.map(metric => ({
          namespace: metric.namespace,
          hit_rate: metric.hit_rate,
          total_requests: metric.total_requests,
          avg_response_time: metric.avg_response_time,
          performance_score: metric.performance_score
        }));

        setCacheMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to load cache metrics:', error);
    }
  };

  const loadSellerPerformanceMetrics = async () => {
    if (!user) return;

    try {
      // Get seller-specific performance data
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, created_at')
        .eq('seller_id', user.id)
        .eq('status', 'active');

      const { data: analytics } = await supabase
        .from('listing_analytics')
        .select('*')
        .in('listing_id', listings?.map(l => l.id) || [])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (listings && analytics) {
        const totalViews = analytics.filter(a => a.event_type === 'view').length;
        const totalClicks = analytics.filter(a => a.event_type === 'click').length;
        const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

        setSellerPerformance({
          totalListings: listings.length,
          totalViews,
          totalClicks,
          conversionRate,
          avgViewsPerListing: listings.length > 0 ? totalViews / listings.length : 0
        });
      }
    } catch (error) {
      console.error('Failed to load seller performance metrics:', error);
    }
  };

  const getSecurityStatusColor = (status: any) => {
    switch (status?.level) {
      case 'high': return 'text-green-600 border-green-200 bg-green-50';
      case 'medium': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'low': return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'very-low': return 'text-red-600 border-red-200 bg-red-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCacheNamespaceLabel = (namespace: string) => {
    switch (namespace) {
      case 'listings': return 'Your Listings';
      case 'profiles': return 'Profile Data';
      case 'search': return 'Search Results';
      default: return namespace;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const securityStatus = getSecurityStatus();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>
              Your account security and fraud protection status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg border ${getSecurityStatusColor(securityStatus)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Trust Level</span>
                <Badge variant="outline" className="border-current">
                  {trustScore || 0}/100
                </Badge>
              </div>
              <p className="text-sm">{securityStatus?.message}</p>
              <Progress value={trustScore || 0} className="h-2 mt-2" />
            </div>

            {recentSignals && recentSignals.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <p className="font-medium">Recent Security Activity</p>
                  <p className="text-sm mt-1">
                    {recentSignals.length} security signal(s) in the last 7 days. 
                    Your account is being monitored for protection.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fraud Protection</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Transaction Monitoring</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Behavioral Analysis</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Platform Performance
            </CardTitle>
            <CardDescription>
              System performance affecting your listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Performance</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getPerformanceColor(performanceScore)}`}>
                  {performanceScore}/100
                </span>
                {isHealthy ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
              </div>
            </div>

            <Progress value={performanceScore} className="h-2" />

            {systemHealth && (
              <div className="space-y-2">
                <p className="text-sm font-medium">System Components</p>
                {Object.entries(systemHealth.components).map(([component, status]) => (
                  <div key={component} className="flex justify-between text-sm">
                    <span className="capitalize">{component}</span>
                    <div className="flex items-center gap-1">
                      {status === 'operational' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                      )}
                      <span className="capitalize">{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Last updated: {systemHealth?.lastChecked ? 
                new Date(systemHealth.lastChecked).toLocaleTimeString() : 
                'Unknown'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Performance Insights */}
      {cacheMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Loading Performance
            </CardTitle>
            <CardDescription>
              How quickly your listings and data load for customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cacheMetrics.map(metric => (
                <div key={metric.namespace} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{getCacheNamespaceLabel(metric.namespace)}</span>
                    <Badge variant={metric.performance_score >= 80 ? 'default' : 'secondary'}>
                      {metric.performance_score}/100
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cache Hit Rate</span>
                      <span className="font-medium">{metric.hit_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time</span>
                      <span className="font-medium">{metric.avg_response_time.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Requests</span>
                      <span className="font-medium">{metric.total_requests}</span>
                    </div>
                  </div>
                  
                  <Progress value={metric.performance_score} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seller Performance Insights */}
      {sellerPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Listing Performance
            </CardTitle>
            <CardDescription>
              Performance metrics for your listings (last 7 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{sellerPerformance.totalListings}</div>
                <div className="text-sm text-muted-foreground">Active Listings</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">{sellerPerformance.totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">{sellerPerformance.avgViewsPerListing.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Views/Listing</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">{sellerPerformance.conversionRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Engagement Rate</div>
              </div>
            </div>

            {sellerPerformance.conversionRate < 2 && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <Eye className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-medium">Tip: Improve Your Visibility</p>
                  <p className="text-sm mt-1">
                    Your engagement rate is below average. Consider updating your listing photos, 
                    descriptions, or pricing to attract more customers.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Tips
          </CardTitle>
          <CardDescription>
            Ways to improve your seller performance and security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Keep Your Profile Updated</p>
                <p className="text-sm text-muted-foreground">
                  Regular profile updates help maintain high trust scores and better search visibility.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Respond Quickly to Messages</p>
                <p className="text-sm text-muted-foreground">
                  Fast response times improve your seller rating and customer satisfaction.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Maintain Good Security Practices</p>
                <p className="text-sm text-muted-foreground">
                  Regular activity and consistent behavior patterns help maintain your trust score.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
