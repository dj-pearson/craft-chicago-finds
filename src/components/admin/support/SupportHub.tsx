/* @ts-nocheck */
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { SupportTicketWithRelations, SupportAnalytics } from '@/integrations/supabase/support-types';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { UserProfilePanel } from './UserProfilePanel';
import { SupportAnalyticsDashboard } from './SupportAnalytics';
import { CannedResponseManager } from './CannedResponseSelector';
import {
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export const SupportHub = () => {
  const { toast } = useToast();
  const { isAdmin, isCityModerator } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicketWithRelations[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [stats, setStats] = useState({
    total_open: 0,
    total_in_progress: 0,
    total_waiting: 0,
    sla_approaching: 0
  });

  useEffect(() => {
    if (!isAdmin && !isCityModerator()) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the support hub',
        variant: 'destructive'
      });
      return;
    }

    loadTickets();
  }, [isAdmin, isCityModerator]);

  const loadTickets = async () => {
    try {
      setLoading(true);

      // TODO: Once support_tickets table exists, uncomment:
      /*
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          user:user_id (
            id,
            display_name,
            email,
            avatar_url
          ),
          assigned_admin:assigned_admin_id (
            id,
            display_name,
            email
          ),
          order:related_order_id (
            id,
            order_number,
            total_amount,
            status
          ),
          dispute:related_dispute_id (
            id,
            title,
            status
          ),
          listing:related_listing_id (
            id,
            title,
            status
          )
        `)
        .in('status', ['open', 'in_progress', 'waiting_on_user'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get message counts for each ticket
      const ticketsWithCounts = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);

          const { count: unreadCount } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .eq('sender_type', 'user')
            .eq('read_by_admin', false);

          return {
            ...ticket,
            message_count: count || 0,
            unread_messages: unreadCount || 0
          };
        })
      );

      setTickets(ticketsWithCounts);

      // Calculate stats
      const stats = {
        total_open: ticketsWithCounts.filter(t => t.status === 'open').length,
        total_in_progress: ticketsWithCounts.filter(t => t.status === 'in_progress').length,
        total_waiting: ticketsWithCounts.filter(t => t.status === 'waiting_on_user').length,
        sla_approaching: ticketsWithCounts.filter(t => {
          if (!t.sla_deadline) return false;
          const hoursRemaining = (new Date(t.sla_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
          return hoursRemaining > 0 && hoursRemaining < 2;
        }).length
      };

      setStats(stats);
      */

      // Mock data for now
      setTickets([]);
      setStats({ total_open: 0, total_in_progress: 0, total_waiting: 0, sla_approaching: 0 });
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = (ticket: SupportTicketWithRelations) => {
    setSelectedTicket(ticket);
  };

  const handleTicketUpdate = () => {
    loadTickets();
  };

  if (!isAdmin && !isCityModerator()) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access the support hub</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Support Hub</h1>
        <p className="text-muted-foreground">Manage customer support tickets and inquiries</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_open}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_in_progress}</div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting on User</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_waiting}</div>
            <p className="text-xs text-muted-foreground">User response needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Approaching</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.sla_approaching}</div>
            <p className="text-xs text-muted-foreground">Due in &lt;2 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">
            <MessageSquare className="h-4 w-4 mr-2" />
            Tickets
            {stats.total_open > 0 && (
              <Badge variant="destructive" className="ml-2">{stats.total_open}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List */}
            <div className="lg:col-span-1">
              <TicketList
                tickets={tickets}
                selectedTicketId={selectedTicket?.id}
                onSelectTicket={handleSelectTicket}
                onRefresh={loadTickets}
                loading={loading}
              />
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="space-y-4">
                  <TicketDetail
                    ticket={selectedTicket}
                    onUpdate={handleTicketUpdate}
                  />
                  {/* Show user profile below ticket for context */}
                  <UserProfilePanel userId={selectedTicket.user_id} />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select a ticket to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <SupportAnalyticsDashboard />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <CannedResponseManager />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Support Hub Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Support settings coming soon...</p>
              {/* TODO: Add settings like SLA thresholds, auto-assignment rules, etc. */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
