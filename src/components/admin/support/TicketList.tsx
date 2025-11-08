import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SupportTicketWithRelations,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/integrations/supabase/support-types';
import {
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface TicketListProps {
  tickets: SupportTicketWithRelations[];
  selectedTicketId?: string;
  onSelectTicket: (ticket: SupportTicketWithRelations) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const TicketList = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onRefresh,
  loading = false
}: TicketListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'sla'>('newest');

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'priority': {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      case 'sla': {
        const getTime = (ticket: SupportTicketWithRelations) =>
          ticket.sla_deadline ? new Date(ticket.sla_deadline).getTime() : Infinity;
        return getTime(a) - getTime(b);
      }
      default:
        return 0;
    }
  });

  const getPriorityColor = (priority: TicketPriority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[priority];
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_on_user: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const getSLAStatus = (ticket: SupportTicketWithRelations) => {
    if (!ticket.sla_deadline || ticket.status === 'resolved' || ticket.status === 'closed') {
      return null;
    }

    const deadline = new Date(ticket.sla_deadline);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isPast(deadline)) {
      return { label: 'SLA Breached', color: 'text-red-600', icon: AlertTriangle };
    } else if (hoursRemaining < 2) {
      return { label: 'Due Soon', color: 'text-orange-600', icon: Clock };
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tickets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets
            <Badge variant="secondary">{filteredTickets.length}</Badge>
          </CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets, users, or ticket numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {TICKET_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {TICKET_PRIORITIES.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TICKET_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="sla">By SLA Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sortedTickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                ? 'No tickets match your filters'
                : 'No support tickets yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTickets.map((ticket) => {
              const slaStatus = getSLAStatus(ticket);
              const isSelected = ticket.id === selectedTicketId;

              return (
                <Button
                  key={ticket.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full h-auto p-4 justify-start text-left ${
                    isSelected ? '' : 'hover:bg-muted'
                  }`}
                  onClick={() => onSelectTicket(ticket)}
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.user?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {ticket.user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{ticket.user?.display_name}</p>
                          <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                        {PRIORITY_LABELS[ticket.priority]}
                      </Badge>
                    </div>

                    {/* Subject */}
                    <p className="font-medium text-sm truncate">{ticket.subject}</p>

                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(ticket.status)} variant="secondary">
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[ticket.category]}
                      </Badge>
                      {ticket.assigned_admin && (
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {ticket.assigned_admin.display_name}
                        </Badge>
                      )}
                      {ticket.message_count !== undefined && ticket.message_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {ticket.message_count}
                          {ticket.unread_messages && ticket.unread_messages > 0 && ` (${ticket.unread_messages} new)`}
                        </Badge>
                      )}
                      {slaStatus && (
                        <Badge variant="outline" className={`text-xs ${slaStatus.color}`}>
                          {React.createElement(slaStatus.icon, { className: 'h-3 w-3 mr-1' })}
                          {slaStatus.label}
                        </Badge>
                      )}
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </span>
                      {ticket.sla_deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          SLA: {format(new Date(ticket.sla_deadline), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
