import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SupportAnalytics, CATEGORY_LABELS, PRIORITY_LABELS, TicketCategory, TicketPriority } from '@/integrations/supabase/support-types';
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
  Clock,
  CheckCircle,
  TrendingUp,
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

      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all tickets for the time range
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (ticketsError) throw ticketsError;

      const allTickets = tickets || [];
      const todayStart = today.toISOString();
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();

      // Calculate basic stats
      const openTickets = allTickets.filter(t => t.status === 'open').length;
      const inProgressTickets = allTickets.filter(t => t.status === 'in_progress').length;
      const waitingTickets = allTickets.filter(t => t.status === 'waiting_on_user').length;
      const createdToday = allTickets.filter(t => t.created_at >= todayStart && t.created_at < todayEnd).length;
      const resolvedToday = allTickets.filter(t => t.resolved_at && t.resolved_at >= todayStart && t.resolved_at < todayEnd).length;

      // Calculate averages
      const ticketsWithResponse = allTickets.filter(t => t.first_response_at);
      const avgFirstResponse = ticketsWithResponse.length > 0
        ? ticketsWithResponse.reduce((sum, t) => {
            const created = new Date(t.created_at).getTime();
            const responded = new Date(t.first_response_at!).getTime();
            return sum + (responded - created) / (1000 * 60 * 60);
          }, 0) / ticketsWithResponse.length
        : 0;

      const resolvedTickets = allTickets.filter(t => t.resolved_at);
      const avgResolution = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const created = new Date(t.created_at).getTime();
            const resolved = new Date(t.resolved_at!).getTime();
            return sum + (resolved - created) / (1000 * 60 * 60);
          }, 0) / resolvedTickets.length
        : 0;

      // SLA compliance
      const ticketsWithSLA = allTickets.filter(t => t.sla_deadline && (t.status === 'resolved' || t.status === 'closed'));
      const slaMet = ticketsWithSLA.filter(t => {
        const deadline = new Date(t.sla_deadline!).getTime();
        const resolved = new Date(t.resolved_at || t.closed_at!).getTime();
        return resolved <= deadline;
      }).length;
      const slaCompliance = ticketsWithSLA.length > 0 ? (slaMet / ticketsWithSLA.length) * 100 : 100;

      // Tickets by category and priority
      const byCategory: Record<TicketCategory, number> = {
        billing: 0, order_issue: 0, account: 0, technical: 0, compliance: 0, other: 0
      };
      const byPriority: Record<TicketPriority, number> = {
        critical: 0, high: 0, normal: 0, low: 0
      };

      allTickets.forEach(t => {
        if (t.category in byCategory) byCategory[t.category as TicketCategory]++;
        if (t.priority in byPriority) byPriority[t.priority as TicketPriority]++;
      });

      // Satisfaction
      const ratedTickets = allTickets.filter(t => t.user_satisfaction_rating);
      const avgSatisfaction = ratedTickets.length > 0
        ? ratedTickets.reduce((sum, t) => sum + t.user_satisfaction_rating!, 0) / ratedTickets.length
        : 0;

      // Daily volume (last 7 days for chart)
      const dailyVolume: { date: string; created: number; resolved: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        dailyVolume.push({
          date: dateStr,
          created: allTickets.filter(t => t.created_at.startsWith(dateStr)).length,
          resolved: allTickets.filter(t => t.resolved_at?.startsWith(dateStr)).length
        });
      }

      // SLA warnings
      const now = Date.now();
      const slaApproaching = allTickets.filter(t => {
        if (!t.sla_deadline || t.status === 'resolved' || t.status === 'closed') return false;
        const deadline = new Date(t.sla_deadline).getTime();
        const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
        return hoursRemaining > 0 && hoursRemaining < 2;
      }).length;

      const slaBreached = allTickets.filter(t => {
        if (!t.sla_deadline || t.status === 'resolved' || t.status === 'closed') return false;
        return new Date(t.sla_deadline).getTime() < now;
      }).length;

      const analyticsData: SupportAnalytics = {
        total_open_tickets: openTickets,
        total_in_progress_tickets: inProgressTickets,
        total_waiting_tickets: waitingTickets,
        tickets_created_today: createdToday,
        tickets_resolved_today: resolvedToday,
        avg_first_response_time_hours: Math.round(avgFirstResponse * 10) / 10,
        avg_resolution_time_hours: Math.round(avgResolution * 10) / 10,
        sla_compliance_rate: Math.round(slaCompliance * 10) / 10,
        tickets_by_category: byCategory,
        tickets_by_priority: byPriority,
        avg_satisfaction_rating: Math.round(avgSatisfaction * 10) / 10,
        total_satisfaction_responses: ratedTickets.length,
        daily_ticket_volume: dailyVolume,
        admin_performance: [], // Would need separate query with joins
        sla_approaching_deadline: slaApproaching,
        sla_breached: slaBreached
      };

      setAnalytics(analyticsData);
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
