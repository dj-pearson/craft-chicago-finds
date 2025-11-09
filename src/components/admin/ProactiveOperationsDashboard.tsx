import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  Server,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Target,
  BarChart3
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';

interface PlatformHealth {
  overall_score: number; // 0-100
  system_status: 'operational' | 'degraded' | 'down';
  active_users_now: number;
  active_users_hour: number;
  active_users_day: number;
  orders_per_hour: number;
  orders_avg_hourly: number;
  error_rate_hour: number; // percentage
  api_response_time: number; // milliseconds
  payment_success_rate: number; // percentage
  database_query_avg: number; // milliseconds
}

interface PredictiveAlert {
  id: string;
  type: 'compliance' | 'fraud' | 'inventory' | 'support' | 'performance' | 'revenue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  suggested_action: string;
  impact: string;
  created_at: string;
  acknowledged: boolean;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  action_type: 'one_click' | 'manual' | 'review';
  action_handler?: () => Promise<void>;
  estimated_time: string;
}

interface DailyDigest {
  date: string;
  platform_health_summary: string;
  total_users: number;
  total_sellers: number;
  total_revenue: number;
  pending_actions: number;
  anomalies: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  top_performers: Array<{
    type: 'seller' | 'product';
    name: string;
    metric: string;
  }>;
  recommendations: string[];
}

export const ProactiveOperationsDashboard = () => {
  const { toast } = useToast();
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth | null>(null);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [dailyDigest, setDailyDigest] = useState<DailyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(loadPlatformHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlatformHealth(),
        loadPredictiveAlerts(),
        loadActionItems(),
        loadDailyDigest()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load operations dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformHealth = async () => {
    try {
      // TODO: Fetch real platform health metrics
      // For now, mock data
      const mockHealth: PlatformHealth = {
        overall_score: 98,
        system_status: 'operational',
        active_users_now: 247,
        active_users_hour: 1523,
        active_users_day: 8942,
        orders_per_hour: 156,
        orders_avg_hourly: 142,
        error_rate_hour: 0.8,
        api_response_time: 245,
        payment_success_rate: 99.2,
        database_query_avg: 48
      };

      setPlatformHealth(mockHealth);
    } catch (error) {
      console.error('Error loading platform health:', error);
    }
  };

  const loadPredictiveAlerts = async () => {
    try {
      // TODO: Fetch real predictive alerts
      // For now, mock alerts
      const mockAlerts: PredictiveAlert[] = [
        {
          id: '1',
          type: 'compliance',
          severity: 'high',
          title: '3 Sellers Approaching $600 Threshold',
          message: 'Three sellers will hit the $600 revenue threshold this week and will require W-9 forms.',
          suggested_action: 'Send proactive compliance reminders now',
          impact: 'Prevents compliance violations and manual follow-up',
          created_at: new Date().toISOString(),
          acknowledged: false
        },
        {
          id: '2',
          type: 'fraud',
          severity: 'critical',
          title: 'Unusual Spike in Velocity Signals from Chicago',
          message: 'Detected 340% increase in transaction velocity signals from Chicago area in the past 2 hours.',
          suggested_action: 'Investigate fraud patterns and consider temporary rate limiting',
          impact: 'Potential fraud prevention, $2,500+ at risk',
          created_at: new Date().toISOString(),
          acknowledged: false
        },
        {
          id: '3',
          type: 'support',
          severity: 'medium',
          title: 'Ticket Volume Up 40% Today',
          message: 'Support ticket volume is 40% above normal. Common issue: checkout process errors.',
          suggested_action: 'Investigate checkout flow for potential bugs',
          impact: 'User experience degradation, potential revenue loss',
          created_at: new Date().toISOString(),
          acknowledged: false
        },
        {
          id: '4',
          type: 'revenue',
          severity: 'medium',
          title: 'Commission Revenue Down 15% This Week',
          message: 'Weekly commission revenue is trending 15% below forecast.',
          suggested_action: 'Analyze seller activity and promotional opportunities',
          impact: '$1,200 weekly revenue shortfall',
          created_at: new Date().toISOString(),
          acknowledged: false
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadActionItems = async () => {
    try {
      // TODO: Generate action items from various sources
      const mockActions: ActionItem[] = [
        {
          id: '1',
          title: 'Send compliance reminders to 3 sellers',
          description: 'Sellers approaching $600 threshold need W-9 notification',
          priority: 'critical',
          category: 'Compliance',
          action_type: 'one_click',
          estimated_time: '30 seconds',
          action_handler: async () => {
            // Execute bulk notification
            toast({ title: 'Success', description: '3 compliance reminders sent' });
          }
        },
        {
          id: '2',
          title: 'Investigate fraud spike in Chicago',
          description: '340% increase in velocity signals requires immediate review',
          priority: 'critical',
          category: 'Security',
          action_type: 'review',
          estimated_time: '10 minutes'
        },
        {
          id: '3',
          title: 'Auto-approve 12 low-risk moderation items',
          description: 'Items with <20% confidence score from verified sellers',
          priority: 'high',
          category: 'Moderation',
          action_type: 'one_click',
          estimated_time: '15 seconds',
          action_handler: async () => {
            toast({ title: 'Success', description: '12 items auto-approved' });
          }
        },
        {
          id: '4',
          title: 'Review checkout flow errors',
          description: 'Support tickets indicate potential checkout bug',
          priority: 'high',
          category: 'Technical',
          action_type: 'review',
          estimated_time: '20 minutes'
        },
        {
          id: '5',
          title: 'Update featured content for Black Friday',
          description: 'Holiday promotion content needs refresh',
          priority: 'medium',
          category: 'Content',
          action_type: 'manual',
          estimated_time: '15 minutes'
        }
      ];

      // Sort by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      mockActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setActionItems(mockActions);
    } catch (error) {
      console.error('Error loading action items:', error);
    }
  };

  const loadDailyDigest = async () => {
    try {
      // TODO: Generate daily digest
      const mockDigest: DailyDigest = {
        date: new Date().toISOString(),
        platform_health_summary: 'All systems operational. Platform health score: 98/100.',
        total_users: 8942,
        total_sellers: 342,
        total_revenue: 45680,
        pending_actions: 5,
        anomalies: [
          {
            type: 'Support Volume',
            description: 'Ticket volume up 40% (investigate checkout flow)',
            severity: 'medium'
          },
          {
            type: 'Revenue',
            description: 'Commission revenue down 15% this week',
            severity: 'medium'
          }
        ],
        top_performers: [
          { type: 'seller', name: 'Artisan Pottery Co.', metric: '$2,340 this week' },
          { type: 'product', name: 'Handmade Ceramic Vase', metric: '89 units sold' }
        ],
        recommendations: [
          'Send compliance reminders to sellers approaching tax thresholds',
          'Investigate checkout flow issues causing support spike',
          'Review fraud signals in Chicago area',
          'Update promotional content for upcoming holiday season'
        ]
      };

      setDailyDigest(mockDigest);
    } catch (error) {
      console.error('Error loading daily digest:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      toast({ title: 'Alert acknowledged' });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const executeAction = async (action: ActionItem) => {
    if (action.action_handler) {
      try {
        await action.action_handler();
        setActionItems(actionItems.filter(a => a.id !== action.id));
      } catch (error) {
        console.error('Error executing action:', error);
        toast({
          title: 'Error',
          description: 'Failed to execute action',
          variant: 'destructive'
        });
      }
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'operational':
        return { label: 'All Systems Operational', icon: CheckCircle, color: 'text-green-600' };
      case 'degraded':
        return { label: 'Degraded Performance', icon: AlertTriangle, color: 'text-yellow-600' };
      case 'down':
        return { label: 'System Down', icon: XCircle, color: 'text-red-600' };
      default:
        return { label: 'Unknown', icon: Activity, color: 'text-gray-600' };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading || !platformHealth) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading operations dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthStatus = getHealthStatus(platformHealth.system_status);
  const HealthIcon = healthStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Command Center</h1>
          <p className="text-muted-foreground">Real-time platform monitoring and proactive alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={platformHealth.system_status === 'operational' ? 'default' : 'destructive'}>
            <HealthIcon className="h-3 w-3 mr-1" />
            {healthStatus.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Platform Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Platform Health Score
            <span className={`text-3xl font-bold ml-auto ${getHealthColor(platformHealth.overall_score)}`}>
              {platformHealth.overall_score}/100
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={platformHealth.overall_score} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Users (Now)</p>
              <p className="text-2xl font-bold">{platformHealth.active_users_now.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders/Hour</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{platformHealth.orders_per_hour}</p>
                {platformHealth.orders_per_hour > platformHealth.orders_avg_hourly ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <p className={`text-2xl font-bold ${platformHealth.error_rate_hour > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {platformHealth.error_rate_hour.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Response</p>
              <p className={`text-2xl font-bold ${platformHealth.api_response_time > 1000 ? 'text-red-600' : 'text-green-600'}`}>
                {platformHealth.api_response_time}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictive Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Predictive Alerts
            <Badge variant="destructive" className="ml-2">
              {alerts.filter(a => !a.acknowledged).length} Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {alerts.filter(a => !a.acknowledged).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
                  <p className="text-muted-foreground">No active alerts - everything looks good!</p>
                </div>
              ) : (
                alerts.filter(a => !a.acknowledged).map((alert) => (
                  <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <Badge variant="outline">{alert.type}</Badge>
                          {alert.title}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="mb-2">{alert.message}</p>
                          <p className="text-sm"><strong>Suggested Action:</strong> {alert.suggested_action}</p>
                          <p className="text-sm"><strong>Impact:</strong> {alert.impact}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </p>
                        </AlertDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </Alert>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Intelligent Action Center
            <Badge variant="secondary" className="ml-2">
              {actionItems.length} Tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actionItems.map((action, index) => (
              <div key={action.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getPriorityIcon(action.priority)}
                    <h4 className="font-medium">{action.title}</h4>
                    <Badge variant="outline" className="ml-auto">{action.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Est. {action.estimated_time}</span>
                    <Badge variant="outline" className="text-xs">{action.action_type}</Badge>
                  </div>
                </div>
                {action.action_type === 'one_click' && action.action_handler && (
                  <Button
                    size="sm"
                    onClick={() => executeAction(action)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                )}
                {action.action_type === 'review' && (
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Digest Summary */}
      {dailyDigest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Today's Digest
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {format(new Date(dailyDigest.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="anomalies">Anomalies ({dailyDigest.anomalies.length})</TabsTrigger>
                <TabsTrigger value="recommendations">Actions ({dailyDigest.recommendations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <p className="text-sm text-muted-foreground">{dailyDigest.platform_health_summary}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded">
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold">{dailyDigest.total_users.toLocaleString()}</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-sm text-muted-foreground">Sellers</p>
                    <p className="text-2xl font-bold">{dailyDigest.total_sellers.toLocaleString()}</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">${dailyDigest.total_revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{dailyDigest.pending_actions}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Top Performers</h4>
                  <div className="space-y-2">
                    {dailyDigest.top_performers.map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{performer.name}</span>
                        <Badge variant="outline">{performer.metric}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="anomalies">
                <div className="space-y-3">
                  {dailyDigest.anomalies.map((anomaly, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <h4 className="font-medium">{anomaly.type}</h4>
                        <Badge variant={getSeverityColor(anomaly.severity)} className="ml-auto">
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations">
                <div className="space-y-2">
                  {dailyDigest.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
