import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SupportAnalytics, CATEGORY_LABELS, PRIORITY_LABELS } from '@/integrations/supabase/support-types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  AlertCircle,
  Star
} from 'lucide-react';

export const SupportAnalyticsDashboard = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // TODO: Once support tables exist, fetch real analytics
      // For now, return mock data
      const mockAnalytics: SupportAnalytics = {
        total_open_tickets: 12,
        total_in_progress_tickets: 8,
        total_waiting_tickets: 5,
        tickets_created_today: 3,
        tickets_resolved_today: 7,
        avg_first_response_time_hours: 2.5,
        avg_resolution_time_hours: 18.4,
        sla_compliance_rate: 92.5,
        tickets_by_category: {
          billing: 15,
          order_issue: 32,
          account: 8,
          technical: 12,
          compliance: 4,
          other: 6
        },
        tickets_by_priority: {
          critical: 2,
          high: 8,
          normal: 45,
          low: 22
        },
        avg_satisfaction_rating: 4.6,
        total_satisfaction_responses: 58,
        daily_ticket_volume: [
          { date: '2025-01-01', created: 5, resolved: 4 },
          { date: '2025-01-02', created: 7, resolved: 6 },
          { date: '2025-01-03', created: 4, resolved: 5 },
          { date: '2025-01-04', created: 8, resolved: 7 },
          { date: '2025-01-05', created: 6, resolved: 8 },
          { date: '2025-01-06', created: 9, resolved: 7 },
          { date: '2025-01-07', created: 5, resolved: 6 },
        ],
        admin_performance: [
          { admin_id: '1', admin_name: 'John Doe', tickets_resolved: 28, avg_resolution_time_hours: 16.2, satisfaction_rating: 4.8 },
          { admin_id: '2', admin_name: 'Jane Smith', tickets_resolved: 24, avg_resolution_time_hours: 18.5, satisfaction_rating: 4.7 },
          { admin_id: '3', admin_name: 'Bob Wilson', tickets_resolved: 19, avg_resolution_time_hours: 20.1, satisfaction_rating: 4.5 },
        ],
        sla_approaching_deadline: 3,
        sla_breached: 1
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d'];

  const categoryData = Object.entries(analytics.tickets_by_category).map(([key, value]) => ({
    name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
    value
  }));

  const priorityData = Object.entries(analytics.tickets_by_priority).map(([key, value]) => ({
    name: PRIORITY_LABELS[key as keyof typeof PRIORITY_LABELS],
    value
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Support Analytics</h2>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg First Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_first_response_time_hours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Target: &lt;2h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_resolution_time_hours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Target: &lt;24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sla_compliance_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.sla_breached} breached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_satisfaction_rating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              {analytics.total_satisfaction_responses} responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ticket Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.daily_ticket_volume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
                <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tickets by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Admin Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.admin_performance.map((admin, index) => (
                <div key={admin.admin_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{admin.admin_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {admin.tickets_resolved} tickets • {admin.avg_resolution_time_hours.toFixed(1)}h avg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                    <span className="font-medium">{admin.satisfaction_rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tickets Created</span>
                <Badge>{analytics.tickets_created_today}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tickets Resolved</span>
                <Badge variant="secondary">{analytics.tickets_resolved_today}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open</span>
                <Badge variant="destructive">{analytics.total_open_tickets}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <Badge>{analytics.total_in_progress_tickets}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Waiting on User</span>
                <Badge variant="outline">{analytics.total_waiting_tickets}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SLA Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Compliance Rate</span>
                <Badge variant="secondary">{analytics.sla_compliance_rate.toFixed(1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approaching Deadline</span>
                <Badge variant="outline" className="text-orange-600">
                  {analytics.sla_approaching_deadline}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Breached</span>
                <Badge variant="destructive">{analytics.sla_breached}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
