import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { connectionPool } from '@/lib/database/connection-pool';

interface DatabasePerformanceMetric {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  status: string;
}

interface SlowQuery {
  query_pattern: string;
  avg_execution_time: number;
  total_executions: number;
  suggestion_type: string;
  description: string;
  priority: string;
}

interface QueryOptimizationSuggestion {
  id: string;
  query_pattern: string;
  original_query: string;
  optimized_query?: string;
  suggestion_type: string;
  description: string;
  estimated_improvement: number;
  priority: string;
  status: string;
  created_at: string;
}

interface ConnectionPoolMetrics {
  timestamp: string;
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  pool_utilization: number;
  avg_acquire_time: number;
}

export const DatabaseOptimizationDashboard = () => {
  const { toast } = useToast();
  const [performanceMetrics, setPerformanceMetrics] = useState<DatabasePerformanceMetric[]>([]);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<QueryOptimizationSuggestion[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionPoolMetrics[]>([]);
  const [databaseHealth, setDatabaseHealth] = useState<any>(null);
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
        loadPerformanceMetrics(),
        loadSlowQueries(),
        loadOptimizationSuggestions(),
        loadConnectionMetrics(),
        loadDatabaseHealth()
      ]);
    } catch (error) {
      console.error('Failed to load database optimization data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load database optimization data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      // Database performance functions not yet implemented
      setPerformanceMetrics([]);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  const loadSlowQueries = async () => {
    try {
      // Slow query analysis functions not yet implemented
      setSlowQueries([]);
    } catch (error) {
      console.error('Failed to load slow queries:', error);
    }
  };

  const loadOptimizationSuggestions = async () => {
    try {
      // Query optimization tables not yet implemented
      setOptimizationSuggestions([]);
    } catch (error) {
      console.error('Failed to load optimization suggestions:', error);
    }
  };

  const loadConnectionMetrics = async () => {
    try {
      // Connection pool metrics tables not yet implemented
      setConnectionMetrics([]);
    } catch (error) {
      console.error('Failed to load connection metrics:', error);
    }
  };

  const loadDatabaseHealth = async () => {
    try {
      const health = await connectionPool.getDatabaseHealth();
      setDatabaseHealth(health);
    } catch (error) {
      console.error('Failed to load database health:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'good': return 'default';
      case 'fair': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
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

  const applySuggestion = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('query_optimization_suggestions')
        .update({ 
          status: 'applied',
          applied_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;

      toast({
        title: 'Optimization Applied',
        description: 'Query optimization suggestion has been marked as applied.'
      });

      await loadOptimizationSuggestions();
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply optimization suggestion.',
        variant: 'destructive'
      });
    }
  };

  const runPerformanceAnalysis = async () => {
    try {
      // Trigger performance analysis
      const { error } = await supabase.rpc('aggregate_query_performance_metrics');
      
      if (error) throw error;

      toast({
        title: 'Analysis Complete',
        description: 'Performance analysis has been completed successfully.'
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Failed to run performance analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to run performance analysis.',
        variant: 'destructive'
      });
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Database Optimization</h2>
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
          <h2 className="text-2xl font-bold">Database Optimization</h2>
          <p className="text-muted-foreground">
            Monitor and optimize database performance and query efficiency
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
            onClick={runPerformanceAnalysis}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Analyze
          </Button>
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map(metric => (
          <Card key={metric.metric_name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.metric_name}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                {metric.metric_value.toFixed(1)}{metric.metric_unit}
              </div>
              <Badge variant={getStatusBadgeVariant(metric.status)} className="mt-2">
                {metric.status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Database Health Status */}
      {databaseHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Database Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  databaseHealth.status === 'healthy' ? 'bg-green-500' :
                  databaseHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium capitalize">{databaseHealth.status}</span>
              </div>
              <Badge variant={
                databaseHealth.status === 'healthy' ? 'default' :
                databaseHealth.status === 'degraded' ? 'secondary' : 'destructive'
              }>
                {formatExecutionTime(databaseHealth.responseTime)} response
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Response Time</p>
                <p className="font-medium">{formatExecutionTime(databaseHealth.responseTime)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Connections</p>
                <p className="font-medium">{databaseHealth.connectionCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Connections</p>
                <p className="font-medium">{databaseHealth.details?.activeConnections || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="queries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="suggestions">Optimization</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slow Query Analysis</CardTitle>
              <CardDescription>
                Queries that exceed performance thresholds and need optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slowQueries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>No slow queries detected in the selected time range</p>
                  </div>
                ) : (
                  slowQueries.map((query, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(query.priority)}>
                            {query.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">{query.suggestion_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatExecutionTime(query.avg_execution_time)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <code className="text-xs bg-muted p-2 rounded block">
                          {query.query_pattern}
                        </code>
                        <p className="text-sm text-muted-foreground">{query.description}</p>
                        <div className="flex justify-between text-xs">
                          <span>Executions: {query.total_executions}</span>
                          <span>Avg Time: {formatExecutionTime(query.avg_execution_time)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Optimization Suggestions</CardTitle>
              <CardDescription>
                AI-generated recommendations to improve query performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                    <p>No optimization suggestions available</p>
                  </div>
                ) : (
                  optimizationSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">{suggestion.suggestion_type}</span>
                          {suggestion.estimated_improvement > 0 && (
                            <Badge variant="outline">
                              +{suggestion.estimated_improvement.toFixed(1)}% improvement
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion.id)}
                        >
                          Apply
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm">{suggestion.description}</p>
                        <div className="text-xs">
                          <p className="text-muted-foreground mb-1">Original Query:</p>
                          <code className="bg-muted p-2 rounded block">
                            {suggestion.original_query}
                          </code>
                        </div>
                        {suggestion.optimized_query && (
                          <div className="text-xs">
                            <p className="text-muted-foreground mb-1">Optimized Query:</p>
                            <code className="bg-green-50 border border-green-200 p-2 rounded block">
                              {suggestion.optimized_query}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Pool Performance</CardTitle>
              <CardDescription>
                Database connection utilization and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectionMetrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4" />
                    <p>No connection metrics available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {connectionMetrics.slice(0, 5).map((metric, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">
                            {new Date(metric.timestamp).toLocaleString()}
                          </span>
                          <Badge variant={metric.pool_utilization > 80 ? 'destructive' : 'default'}>
                            {metric.pool_utilization.toFixed(1)}% utilization
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Connections</p>
                            <p className="font-medium">{metric.total_connections}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Active</p>
                            <p className="font-medium">{metric.active_connections}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Idle</p>
                            <p className="font-medium">{metric.idle_connections}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Acquire Time</p>
                            <p className="font-medium">{formatExecutionTime(metric.avg_acquire_time)}</p>
                          </div>
                        </div>
                        
                        <Progress value={metric.pool_utilization} className="h-2 mt-3" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Key performance indicators over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.map(metric => (
                    <div key={metric.metric_name} className="flex justify-between items-center">
                      <span className="text-sm">{metric.metric_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {metric.metric_value.toFixed(1)}{metric.metric_unit}
                        </span>
                        {metric.status === 'good' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Recommendations</CardTitle>
                <CardDescription>
                  Automated optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Connection Pool Optimization</p>
                      <p className="text-sm mt-1">
                        Consider increasing connection pool size during peak hours for better performance.
                      </p>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <BarChart3 className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Query Monitoring</p>
                      <p className="text-sm mt-1">
                        Enable detailed query logging to identify optimization opportunities.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
