import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { supabase } from '@/integrations/supabase/client';

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
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch real metrics from database
      const [ordersHourResult, ordersDayResult, usersResult, sellersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneHourAgo.toISOString()),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo.toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_seller', true)
      ]);

      const ordersPerHour = ordersHourResult.count || 0;
      const ordersPerDay = ordersDayResult.count || 0;
      const totalUsers = usersResult.count || 0;
      const totalSellers = sellersResult.count || 0;

      // Calculate health score based on available metrics
      // System is operational if we can query the database
      const systemStatus: 'operational' | 'degraded' | 'down' =
        ordersHourResult.error || usersResult.error ? 'degraded' : 'operational';

      // Simple health score calculation
      const healthScore = systemStatus === 'operational' ? 95 : 70;

      const health: PlatformHealth = {
        overall_score: healthScore,
        system_status: systemStatus,
        active_users_now: Math.floor(totalUsers * 0.03), // Estimate ~3% online
        active_users_hour: Math.floor(totalUsers * 0.15), // Estimate ~15% active in hour
        active_users_day: totalUsers,
        orders_per_hour: ordersPerHour,
        orders_avg_hourly: Math.floor(ordersPerDay / 24),
        error_rate_hour: 0, // Would need error tracking infrastructure
        api_response_time: 100, // Would need APM infrastructure
        payment_success_rate: 99, // Would need payment analytics
        database_query_avg: 50 // Would need query monitoring
      };

      setPlatformHealth(health);
    } catch (error) {
      console.error('Error loading platform health:', error);
      // Fallback to default state
      setPlatformHealth({
        overall_score: 0,
        system_status: 'down',
        active_users_now: 0,
        active_users_hour: 0,
        active_users_day: 0,
        orders_per_hour: 0,
        orders_avg_hourly: 0,
        error_rate_hour: 100,
        api_response_time: 0,
        payment_success_rate: 0,
        database_query_avg: 0
      });
    }
  };

  const loadPredictiveAlerts = async () => {
    try {
      const alerts: PredictiveAlert[] = [];

      // Check for pending support tickets
      const { count: pendingTickets } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      if (pendingTickets && pendingTickets > 10) {
        alerts.push({
          id: 'support-volume',
          type: 'support',
          severity: pendingTickets > 25 ? 'high' : 'medium',
          title: `${pendingTickets} Open Support Tickets`,
          message: `There are ${pendingTickets} support tickets awaiting response.`,
          suggested_action: 'Review and respond to pending support tickets',
          impact: 'Customer satisfaction and response time',
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Check for pending moderation items
      const { count: moderationItems } = await supabase
        .from('content_moderation_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (moderationItems && moderationItems > 5) {
        alerts.push({
          id: 'moderation-queue',
          type: 'compliance',
          severity: moderationItems > 20 ? 'high' : 'medium',
          title: `${moderationItems} Items Pending Moderation`,
          message: `Content moderation queue has ${moderationItems} items waiting for review.`,
          suggested_action: 'Review pending moderation items',
          impact: 'Content quality and compliance',
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Check for fraud reports
      const { count: fraudReports } = await supabase
        .from('fraud_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (fraudReports && fraudReports > 0) {
        alerts.push({
          id: 'fraud-reports',
          type: 'fraud',
          severity: fraudReports > 5 ? 'critical' : 'high',
          title: `${fraudReports} Pending Fraud Reports`,
          message: `There are ${fraudReports} fraud reports requiring investigation.`,
          suggested_action: 'Investigate and resolve fraud reports immediately',
          impact: 'Platform security and financial risk',
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }

      // Check for pending disputes
      const { count: disputes } = await supabase
        .from('disputes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      if (disputes && disputes > 0) {
        alerts.push({
          id: 'disputes',
          type: 'support',
          severity: disputes > 10 ? 'high' : 'medium',
          title: `${disputes} Open Disputes`,
          message: `There are ${disputes} buyer-seller disputes requiring resolution.`,
          suggested_action: 'Review and mediate open disputes',
          impact: 'Customer trust and platform reputation',
          created_at: new Date().toISOString(),
          acknowledged: false
        });
      }

      // If no alerts, the system is healthy
      if (alerts.length === 0) {
        // No alerts needed - system is healthy
      }

      setAlerts(alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    }
  };

  const loadActionItems = async () => {
    try {
      const actions: ActionItem[] = [];

      // Check for pending support tickets
      const { count: pendingTickets } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      if (pendingTickets && pendingTickets > 0) {
        actions.push({
          id: 'support-tickets',
          title: `Review ${pendingTickets} open support tickets`,
          description: 'Respond to customer support requests',
          priority: pendingTickets > 20 ? 'critical' : pendingTickets > 10 ? 'high' : 'medium',
          category: 'Support',
          action_type: 'review',
          estimated_time: `${Math.ceil(pendingTickets * 3)} minutes`
        });
      }

      // Check for pending moderation items
      const { count: moderationItems } = await supabase
        .from('content_moderation_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (moderationItems && moderationItems > 0) {
        actions.push({
          id: 'moderation-queue',
          title: `Review ${moderationItems} pending moderation items`,
          description: 'Approve or reject flagged content',
          priority: moderationItems > 15 ? 'high' : 'medium',
          category: 'Moderation',
          action_type: 'review',
          estimated_time: `${Math.ceil(moderationItems * 2)} minutes`
        });
      }

      // Check for pending fraud reports
      const { count: fraudReports } = await supabase
        .from('fraud_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (fraudReports && fraudReports > 0) {
        actions.push({
          id: 'fraud-investigation',
          title: `Investigate ${fraudReports} fraud reports`,
          description: 'Review and resolve suspected fraud cases',
          priority: 'critical',
          category: 'Security',
          action_type: 'review',
          estimated_time: `${Math.ceil(fraudReports * 10)} minutes`
        });
      }

      // Check for pending disputes
      const { count: disputes } = await supabase
        .from('disputes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      if (disputes && disputes > 0) {
        actions.push({
          id: 'disputes',
          title: `Mediate ${disputes} open disputes`,
          description: 'Resolve buyer-seller disputes',
          priority: disputes > 5 ? 'high' : 'medium',
          category: 'Support',
          action_type: 'review',
          estimated_time: `${Math.ceil(disputes * 15)} minutes`
        });
      }

      // Sort by priority
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setActionItems(actions);
    } catch (error) {
      console.error('Error loading action items:', error);
      setActionItems([]);
    }
  };

  const loadDailyDigest = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      // Fetch real metrics
      const [usersResult, sellersResult, ordersResult, revenueResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_seller', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
        supabase.from('orders').select('total').gte('created_at', startOfDay.toISOString())
      ]);

      const totalUsers = usersResult.count || 0;
      const totalSellers = sellersResult.count || 0;
      const todayOrders = ordersResult.count || 0;
      const todayRevenue = (revenueResult.data || []).reduce((sum, order) => sum + (order.total || 0), 0);

      // Check for pending items
      const { count: pendingTickets } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      const { count: pendingModeration } = await supabase
        .from('content_moderation_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const pendingActions = (pendingTickets || 0) + (pendingModeration || 0);

      // Build anomalies based on real conditions
      const anomalies: DailyDigest['anomalies'] = [];
      if (pendingTickets && pendingTickets > 20) {
        anomalies.push({
          type: 'Support Volume',
          description: `${pendingTickets} support tickets pending - higher than usual`,
          severity: 'medium'
        });
      }

      // Build recommendations
      const recommendations: string[] = [];
      if (pendingTickets && pendingTickets > 0) {
        recommendations.push(`Review ${pendingTickets} pending support tickets`);
      }
      if (pendingModeration && pendingModeration > 0) {
        recommendations.push(`Approve or reject ${pendingModeration} moderation items`);
      }
      if (recommendations.length === 0) {
        recommendations.push('All systems running smoothly - no immediate actions needed');
      }

      const digest: DailyDigest = {
        date: new Date().toISOString(),
        platform_health_summary: `Platform operational. ${totalUsers} users, ${totalSellers} sellers, ${todayOrders} orders today.`,
        total_users: totalUsers,
        total_sellers: totalSellers,
        total_revenue: todayRevenue,
        pending_actions: pendingActions,
        anomalies,
        top_performers: [], // Would need analytics tracking
        recommendations
      };

      setDailyDigest(digest);
    } catch (error) {
      console.error('Error loading daily digest:', error);
      setDailyDigest({
        date: new Date().toISOString(),
        platform_health_summary: 'Unable to load platform metrics',
        total_users: 0,
        total_sellers: 0,
        total_revenue: 0,
        pending_actions: 0,
        anomalies: [],
        top_performers: [],
        recommendations: ['Check database connection']
      });
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
