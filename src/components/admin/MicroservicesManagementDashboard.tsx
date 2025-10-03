import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Activity, 
  Zap, 
  Network, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { serviceRegistry } from '@/lib/microservices/service-registry';
import { eventBus } from '@/lib/microservices/event-bus';
import { apiGateway } from '@/lib/microservices/api-gateway';

interface ServiceHealth {
  service_id: string;
  service_name: string;
  total_instances: number;
  healthy_instances: number;
  unhealthy_instances: number;
  avg_response_time: number;
  last_health_check: string;
}

interface EventStats {
  event_type: string;
  total_events: number;
  processed_events: number;
  failed_events: number;
  avg_processing_time: number;
  success_rate: number;
}

interface GatewayMetrics {
  route_path: string;
  method: string;
  service_id: string;
  total_requests: number;
  avg_response_time: number;
  error_rate: number;
  p95_response_time: number;
}

export const MicroservicesManagementDashboard = () => {
  const { toast } = useToast();
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [gatewayMetrics, setGatewayMetrics] = useState<GatewayMetrics[]>([]);
  const [systemOverview, setSystemOverview] = useState<any>(null);
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
        loadServiceHealth(),
        loadEventStatistics(),
        loadGatewayMetrics(),
        loadSystemOverview()
      ]);
    } catch (error) {
      console.error('Failed to load microservices dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load microservices data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServiceHealth = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_service_health_summary');

      if (error) throw error;
      setServiceHealth(data || []);
    } catch (error) {
      console.error('Failed to load service health:', error);
    }
  };

  const loadEventStatistics = async () => {
    try {
      const timeFilter = getTimeFilter(selectedTimeRange);
      
      const { data, error } = await supabase
        .rpc('get_event_processing_stats', {
          start_time: timeFilter,
          end_time: new Date().toISOString()
        });

      if (error) throw error;
      setEventStats(data || []);
    } catch (error) {
      console.error('Failed to load event statistics:', error);
    }
  };

  const loadGatewayMetrics = async () => {
    try {
      const timeFilter = getTimeFilter(selectedTimeRange);
      
      const { data, error } = await supabase
        .rpc('get_api_gateway_metrics', {
          start_time: timeFilter,
          end_time: new Date().toISOString()
        });

      if (error) throw error;
      setGatewayMetrics(data || []);
    } catch (error) {
      console.error('Failed to load gateway metrics:', error);
    }
  };

  const loadSystemOverview = async () => {
    try {
      // Get statistics from each component
      const serviceStats = serviceRegistry.getServiceStatistics();
      const eventBusStats = eventBus.getStatistics();
      const gatewayStats = apiGateway.getStatistics();

      setSystemOverview({
        services: serviceStats,
        eventBus: eventBusStats,
        gateway: gatewayStats
      });
    } catch (error) {
      console.error('Failed to load system overview:', error);
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

  const getHealthColor = (healthyInstances: number, totalInstances: number) => {
    if (totalInstances === 0) return 'text-gray-500';
    const healthRate = (healthyInstances / totalInstances) * 100;
    if (healthRate >= 90) return 'text-green-600';
    if (healthRate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeVariant = (healthyInstances: number, totalInstances: number) => {
    if (totalInstances === 0) return 'secondary';
    const healthRate = (healthyInstances / totalInstances) * 100;
    if (healthRate >= 90) return 'default';
    if (healthRate >= 70) return 'secondary';
    return 'destructive';
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const restartService = async (serviceId: string) => {
    try {
      // This would typically trigger a service restart through the orchestration system
      await eventBus.publishEvent({
        type: 'service.restart.requested',
        source: 'admin-dashboard',
        target: serviceId,
        payload: {
          serviceId,
          requestedBy: 'admin',
          timestamp: new Date().toISOString()
        },
        metadata: {
          category: 'service-management'
        }
      });

      toast({
        title: 'Service Restart Requested',
        description: `Restart request sent for service: ${serviceId}`
      });
    } catch (error) {
      console.error('Failed to restart service:', error);
      toast({
        title: 'Error',
        description: 'Failed to request service restart.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Microservices Management</h2>
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

  const totalServices = systemOverview?.services?.totalServices || 0;
  const totalInstances = systemOverview?.services?.totalInstances || 0;
  const healthyInstances = systemOverview?.services?.healthyInstances || 0;
  const totalEvents = eventStats.reduce((sum, stat) => sum + stat.total_events, 0);
  const totalRequests = gatewayMetrics.reduce((sum, metric) => sum + metric.total_requests, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Microservices Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage distributed services architecture
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
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {totalInstances} total instances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(healthyInstances, totalInstances)}`}>
              {totalInstances > 0 ? ((healthyInstances / totalInstances) * 100).toFixed(1) : 0}%
            </div>
            <Progress value={totalInstances > 0 ? (healthyInstances / totalInstances) * 100 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Processed</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Through gateway
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="events">Event Bus</TabsTrigger>
          <TabsTrigger value="gateway">API Gateway</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Health Status</CardTitle>
              <CardDescription>
                Current health and performance of all registered services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceHealth.map(service => (
                  <div key={service.service_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{service.service_name}</h4>
                        <Badge variant={getHealthBadgeVariant(service.healthy_instances, service.total_instances)}>
                          {service.healthy_instances}/{service.total_instances} healthy
                        </Badge>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {service.service_id}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restartService(service.service_id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Restart
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Instances</p>
                        <p className="font-medium">{service.total_instances}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Response Time</p>
                        <p className="font-medium">{formatResponseTime(service.avg_response_time)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Health Rate</p>
                        <p className="font-medium">
                          {service.total_instances > 0 
                            ? ((service.healthy_instances / service.total_instances) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Check</p>
                        <p className="font-medium">
                          {service.last_health_check 
                            ? new Date(service.last_health_check).toLocaleTimeString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>

                    {service.total_instances > 0 && (
                      <Progress 
                        value={(service.healthy_instances / service.total_instances) * 100} 
                        className="h-2 mt-3" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Processing Statistics</CardTitle>
              <CardDescription>
                Event bus performance and processing metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventStats.map(stat => (
                  <div key={stat.event_type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{stat.event_type}</h4>
                        <Badge variant={stat.success_rate >= 95 ? 'default' : stat.success_rate >= 90 ? 'secondary' : 'destructive'}>
                          {stat.success_rate.toFixed(1)}% success
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Events</p>
                        <p className="font-medium">{stat.total_events.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Processed</p>
                        <p className="font-medium text-green-600">{stat.processed_events.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed</p>
                        <p className="font-medium text-red-600">{stat.failed_events.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Processing Time</p>
                        <p className="font-medium">{formatResponseTime(stat.avg_processing_time)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">{stat.success_rate.toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <Progress value={stat.success_rate} className="h-2 mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateway" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Gateway Performance</CardTitle>
              <CardDescription>
                Request routing and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gatewayMetrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{metric.method}</Badge>
                        <code className="text-sm">{metric.route_path}</code>
                        <span className="text-sm text-muted-foreground">→ {metric.service_id}</span>
                      </div>
                      <Badge variant={metric.error_rate < 1 ? 'default' : metric.error_rate < 5 ? 'secondary' : 'destructive'}>
                        {metric.error_rate.toFixed(1)}% errors
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Requests</p>
                        <p className="font-medium">{metric.total_requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Response Time</p>
                        <p className="font-medium">{formatResponseTime(metric.avg_response_time)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P95 Response Time</p>
                        <p className="font-medium">{formatResponseTime(metric.p95_response_time)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Error Rate</p>
                        <p className="font-medium">{metric.error_rate.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>
                  Current system health alerts and warnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceHealth.filter(s => s.healthy_instances < s.total_instances).length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">All services are healthy</span>
                    </div>
                  ) : (
                    serviceHealth
                      .filter(s => s.healthy_instances < s.total_instances)
                      .map(service => (
                        <Alert key={service.service_id} className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <p className="font-medium">{service.service_name}</p>
                            <p className="text-sm">
                              {service.unhealthy_instances} of {service.total_instances} instances are unhealthy
                            </p>
                          </AlertDescription>
                        </Alert>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key performance indicators and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall System Health</span>
                    <span className={`font-medium ${getHealthColor(healthyInstances, totalInstances)}`}>
                      {totalInstances > 0 ? ((healthyInstances / totalInstances) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Event Processing Success Rate</span>
                    <span className="font-medium">
                      {eventStats.length > 0 
                        ? (eventStats.reduce((sum, stat) => sum + stat.success_rate, 0) / eventStats.length).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Gateway Error Rate</span>
                    <span className="font-medium">
                      {gatewayMetrics.length > 0 
                        ? (gatewayMetrics.reduce((sum, metric) => sum + metric.error_rate, 0) / gatewayMetrics.length).toFixed(2)
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Event Subscriptions</span>
                    <span className="font-medium">
                      {systemOverview?.eventBus?.totalSubscriptions || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
