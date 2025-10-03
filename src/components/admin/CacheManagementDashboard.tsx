import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Zap, 
  TrendingUp, 
  Settings, 
  RefreshCw,
  BarChart3,
  Clock,
  HardDrive,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cacheManager, cachedDataService } from '@/lib/caching-strategy';

interface CacheConfiguration {
  id: string;
  namespace: string;
  ttl_seconds: number;
  max_size_bytes: number;
  eviction_strategy: string;
  is_active: boolean;
  performance_threshold_ms: number;
}

interface CacheMetrics {
  namespace: string;
  hit_rate: number;
  total_requests: number;
  avg_response_time: number;
  performance_score: number;
  period_start: string;
  period_end: string;
}

interface CacheRecommendation {
  type: string;
  priority: string;
  reason: string;
  current_value: any;
  recommended_value: any;
}

export const CacheManagementDashboard = () => {
  const { toast } = useToast();
  const [configurations, setConfigurations] = useState<CacheConfiguration[]>([]);
  const [metrics, setMetrics] = useState<CacheMetrics[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, CacheRecommendation[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCacheConfigurations(),
        loadCacheMetrics(),
        loadCacheRecommendations()
      ]);
    } catch (error) {
      console.error('Failed to load cache dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cache management data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCacheConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('cache_configurations')
        .select('*')
        .order('namespace');

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Failed to load cache configurations:', error);
    }
  };

  const loadCacheMetrics = async () => {
    try {
      const timeFilter = getTimeFilter(selectedTimeRange);
      
      const { data, error } = await supabase
        .from('cache_performance_metrics')
        .select('*')
        .gte('period_start', timeFilter)
        .order('period_start', { ascending: false });

      if (error) throw error;

      // Group by namespace and get latest metrics
      const latestMetrics: Record<string, CacheMetrics> = {};
      
      (data || []).forEach(metric => {
        if (!latestMetrics[metric.namespace] || 
            new Date(metric.period_start) > new Date(latestMetrics[metric.namespace].period_start)) {
          latestMetrics[metric.namespace] = metric;
        }
      });

      setMetrics(Object.values(latestMetrics));
    } catch (error) {
      console.error('Failed to load cache metrics:', error);
    }
  };

  const loadCacheRecommendations = async () => {
    try {
      const recommendationsMap: Record<string, CacheRecommendation[]> = {};
      
      for (const config of configurations) {
        const { data, error } = await supabase
          .rpc('optimize_cache_configuration', { target_namespace: config.namespace });

        if (error) {
          console.error(`Failed to get recommendations for ${config.namespace}:`, error);
          continue;
        }

        if (data && Array.isArray(data)) {
          recommendationsMap[config.namespace] = data;
        }
      }

      setRecommendations(recommendationsMap);
    } catch (error) {
      console.error('Failed to load cache recommendations:', error);
    }
  };

  const getTimeFilter = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const updateCacheConfiguration = async (namespace: string, updates: Partial<CacheConfiguration>) => {
    try {
      const { error } = await supabase
        .from('cache_configurations')
        .update(updates)
        .eq('namespace', namespace);

      if (error) throw error;

      await loadCacheConfigurations();
      
      toast({
        title: 'Configuration Updated',
        description: `Cache configuration for ${namespace} has been updated.`
      });
    } catch (error) {
      console.error('Failed to update cache configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cache configuration.',
        variant: 'destructive'
      });
    }
  };

  const clearCache = async (namespace: string) => {
    try {
      await cachedDataService.invalidateListingCache();
      
      toast({
        title: 'Cache Cleared',
        description: `Cache for ${namespace} has been cleared successfully.`
      });
      
      // Reload metrics after clearing cache
      setTimeout(loadCacheMetrics, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cache.',
        variant: 'destructive'
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cache Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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

  const totalHitRate = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.hit_rate, 0) / metrics.length 
    : 0;
  
  const avgResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.avg_response_time, 0) / metrics.length 
    : 0;
  
  const totalRequests = metrics.reduce((sum, m) => sum + m.total_requests, 0);
  
  const avgPerformanceScore = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.performance_score, 0) / metrics.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cache Management</h2>
          <p className="text-muted-foreground">
            Monitor and optimize application caching performance
          </p>
        </div>
        <div className="flex gap-2">
          {['1h', '24h', '7d'].map(range => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Cache Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHitRate.toFixed(1)}%</div>
            <Progress value={totalHitRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;100ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(avgPerformanceScore)}`}>
              {avgPerformanceScore.toFixed(0)}/100
            </div>
            <Progress value={avgPerformanceScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance by Namespace</CardTitle>
              <CardDescription>
                Performance metrics for each cache namespace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map(metric => (
                  <div key={metric.namespace} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium capitalize">{metric.namespace}</h4>
                        <Badge variant={metric.performance_score >= 80 ? 'default' : 'secondary'}>
                          {metric.performance_score}/100
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearCache(metric.namespace)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Hit Rate</p>
                        <p className="font-medium">{metric.hit_rate.toFixed(1)}%</p>
                        <Progress value={metric.hit_rate} className="h-1 mt-1" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">Response Time</p>
                        <p className="font-medium">{metric.avg_response_time.toFixed(0)}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Requests</p>
                        <p className="font-medium">{metric.total_requests.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Configurations</CardTitle>
              <CardDescription>
                Manage cache settings for each namespace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configurations.map(config => (
                  <div key={config.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium capitalize">{config.namespace}</h4>
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCacheConfiguration(config.namespace, { 
                          is_active: !config.is_active 
                        })}
                      >
                        {config.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">TTL</p>
                        <p className="font-medium">{config.ttl_seconds}s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max Size</p>
                        <p className="font-medium">{formatBytes(config.max_size_bytes)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Strategy</p>
                        <p className="font-medium uppercase">{config.eviction_strategy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Threshold</p>
                        <p className="font-medium">{config.performance_threshold_ms}ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                AI-generated suggestions to improve cache performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(recommendations).map(([namespace, recs]) => (
                  <div key={namespace}>
                    <h4 className="font-medium capitalize mb-3">{namespace} Cache</h4>
                    {recs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No recommendations available. Cache is performing optimally.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {recs.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={getPriorityColor(rec.priority)}>
                                    {rec.priority.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm font-medium">{rec.type.replace('_', ' ')}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{rec.reason}</p>
                                <div className="text-xs mt-1">
                                  Current: {JSON.stringify(rec.current_value)} → 
                                  Recommended: {JSON.stringify(rec.recommended_value)}
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
