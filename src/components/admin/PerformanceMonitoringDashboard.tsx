import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Database,
  Globe,
  Server,
  Wifi,
  Eye,
  BarChart3
} from 'lucide-react';
import { useEnhancedPerformanceMonitor } from '@/hooks/useEnhancedPerformanceMonitor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PerformanceRecommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  impact_estimate: string;
  implementation_effort: string;
  status: string;
  created_at: string;
}

interface ApiEndpointMetric {
  endpoint: string;
  method: string;
  avg_response_time: number;
  success_rate: number;
  request_count: number;
  error_count: number;
}

export const PerformanceMonitoringDashboard = () => {
  const { toast } = useToast();
  const {
    systemHealth,
    uptimeMetrics,
    alerts,
    performanceScore,
    isHealthy,
    loadSystemHealth,
    loadActiveAlerts,
    loadUptimeMetrics,
    resolveAlert
  } = useEnhancedPerformanceMonitor({ enableRealTimeAlerts: true });

  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiEndpointMetric[]>([]);
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
        loadSystemHealth(),
        loadActiveAlerts(),
        loadUptimeMetrics(),
        loadRecommendations(),
        loadApiMetrics()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load performance monitoring data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_recommendations')
        .select('*')
        .neq('status', 'dismissed')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const loadApiMetrics = async () => {
    try {
      const timeFilter = getTimeFilter(selectedTimeRange);
      
      const { data, error } = await supabase
        .from('api_endpoint_metrics')
        .select('endpoint, method, response_time, success')
        .gte('created_at', timeFilter);

      if (error) throw error;

      // Aggregate metrics by endpoint
      const aggregated = (data || []).reduce((acc: Record<string, any>, metric) => {
        const key = `${metric.method} ${metric.endpoint}`;
        
        if (!acc[key]) {
          acc[key] = {
            endpoint: metric.endpoint,
            method: metric.method,
            total_time: 0,
            request_count: 0,
            success_count: 0,
            error_count: 0
          };
        }
        
        acc[key].total_time += metric.response_time;
        acc[key].request_count += 1;
        
        if (metric.success) {
          acc[key].success_count += 1;
        } else {
          acc[key].error_count += 1;
        }
        
        return acc;
      }, {});

      const metrics: ApiEndpointMetric[] = Object.values(aggregated).map((agg: any) => ({
        endpoint: agg.endpoint,
        method: agg.method,
        avg_response_time: agg.request_count > 0 ? agg.total_time / agg.request_count : 0,
        success_rate: agg.request_count > 0 ? (agg.success_count / agg.request_count) * 100 : 100,
        request_count: agg.request_count,
        error_count: agg.error_count
      }));

      setApiMetrics(metrics.sort((a, b) => b.request_count - a.request_count));
    } catch (error) {
      console.error('Failed to load API metrics:', error);
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
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId, 'Manually resolved by admin');
      toast({
        title: 'Alert Resolved',
        description: 'Performance alert has been resolved successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const updateRecommendationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('performance_recommendations')
        .update({ 
          status, 
          completed_at: status === 'completed' ? new Date().toISOString() : null 
        })
        .eq('id', id);

      if (error) throw error;

      await loadRecommendations();
      
      toast({
        title: 'Recommendation Updated',
        description: `Recommendation marked as ${status}.`
      });
    } catch (error) {
      console.error('Failed to update recommendation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recommendation status.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
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
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time system health, alerts, and performance optimization
          </p>
        </div>
        <div className="flex gap-2">
          {['1h', '24h', '7d', '30d'].map(range => (
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

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {systemHealth && getStatusIcon(systemHealth.status)}
              <span className={`text-2xl font-bold ${systemHealth ? getStatusColor(systemHealth.status) : ''}`}>
                {systemHealth?.status || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {systemHealth?.score || 0}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {uptimeMetrics?.uptime.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {uptimeMetrics?.slaTarget || 99.9}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter(a => a.type === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceScore}/100
            </div>
            <Progress value={performanceScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uptimeMetrics?.incidents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              MTTR: {uptimeMetrics?.mttr.toFixed(1) || 0}min
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Components</CardTitle>
                <CardDescription>
                  Current status of all system components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemHealth?.components && Object.entries(systemHealth.components).map(([component, status]) => (
                    <div key={component} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {component === 'frontend' && <Globe className="h-4 w-4" />}
                        {component === 'api' && <Server className="h-4 w-4" />}
                        {component === 'database' && <Database className="h-4 w-4" />}
                        {component === 'payments' && <Shield className="h-4 w-4" />}
                        {component === 'cdn' && <Wifi className="h-4 w-4" />}
                        <span className="font-medium capitalize">{component}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className={`text-sm ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Metrics</CardTitle>
                <CardDescription>
                  Service Level Agreement performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Availability</span>
                    <span className="font-medium">
                      {uptimeMetrics?.availability.toFixed(3) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downtime (24h)</span>
                    <span className="font-medium">
                      {uptimeMetrics?.downtime || 0} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean Time to Recovery</span>
                    <span className="font-medium">
                      {uptimeMetrics?.mttr.toFixed(1) || 0} minutes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SLA Status</span>
                    <Badge variant={
                      (uptimeMetrics?.availability || 0) >= (uptimeMetrics?.slaTarget || 99.9) 
                        ? 'default' 
                        : 'destructive'
                    }>
                      {(uptimeMetrics?.availability || 0) >= (uptimeMetrics?.slaTarget || 99.9) 
                        ? 'Met' 
                        : 'Breached'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Performance Alerts</CardTitle>
              <CardDescription>
                Current alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active alerts</p>
                    <p className="text-sm">System is performing well!</p>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-4 w-4 ${
                            alert.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
                                {alert.type.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium">{alert.metric}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Value: {alert.value} | Threshold: {alert.threshold}</p>
                        <p>Time: {new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemHealth?.components && Object.entries(systemHealth.components).map(([component, status]) => (
              <Card key={component}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{component}</CardTitle>
                  {component === 'frontend' && <Globe className="h-4 w-4 text-muted-foreground" />}
                  {component === 'api' && <Server className="h-4 w-4 text-muted-foreground" />}
                  {component === 'database' && <Database className="h-4 w-4 text-muted-foreground" />}
                  {component === 'payments' && <Shield className="h-4 w-4 text-muted-foreground" />}
                  {component === 'cdn' && <Wifi className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className={`text-lg font-semibold ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last checked: {systemHealth.lastChecked ? new Date(systemHealth.lastChecked).toLocaleTimeString() : 'Unknown'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
              <CardDescription>
                Response times and success rates for API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiMetrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No API metrics available</p>
                    <p className="text-sm">Data will appear as API calls are made</p>
                  </div>
                ) : (
                  apiMetrics.map((metric, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{metric.method}</Badge>
                          <span className="font-medium">{metric.endpoint}</span>
                        </div>
                        <Badge variant={metric.success_rate >= 95 ? 'default' : 'destructive'}>
                          {metric.success_rate.toFixed(1)}% success
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg Response</p>
                          <p className="font-medium">{metric.avg_response_time.toFixed(0)}ms</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Requests</p>
                          <p className="font-medium">{metric.request_count}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Errors</p>
                          <p className="font-medium">{metric.error_count}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
              <CardDescription>
                AI-generated suggestions to improve system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recommendations available</p>
                    <p className="text-sm">System is optimally configured!</p>
                  </div>
                ) : (
                  recommendations.map(rec => (
                    <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getPriorityColor(rec.priority)}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {rec.recommendation_type}
                            </Badge>
                            <Badge variant={
                              rec.status === 'completed' ? 'default' :
                              rec.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }>
                              {rec.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rec.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Impact: {rec.impact_estimate}</span>
                            <span>Effort: {rec.implementation_effort}</span>
                          </div>
                        </div>
                        
                        {rec.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRecommendationStatus(rec.id, 'in_progress')}
                            >
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                        
                        {rec.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
