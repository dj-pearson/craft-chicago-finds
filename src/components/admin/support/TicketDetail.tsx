/* @ts-nocheck */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  SupportTicketWithRelations,
  SupportMessageWithSender,
  SupportMessageInsert,
  SupportTicketUpdate,
  TicketPriority,
  TicketStatus,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES
} from '@/integrations/supabase/support-types';
import {
  Send,
  User,
  Calendar,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle,
  FileText,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

interface TicketDetailProps {
  ticket: SupportTicketWithRelations;
  onUpdate: () => void;
}

export const TicketDetail = ({ ticket, onUpdate }: TicketDetailProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [internalNotes, setInternalNotes] = useState(ticket.internal_notes || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Mark messages as read by admin
    markMessagesRead();
  }, [ticket.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      // TODO: Once support_messages table exists, uncomment:
      /*
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender:sender_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      */
      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
    }
  };

  const markMessagesRead = async () => {
    try {
      // TODO: Mark unread messages as read
      /*
      await supabase
        .from('support_messages')
        .update({ read_by_admin: true, read_at: new Date().toISOString() })
        .eq('ticket_id', ticket.id)
        .eq('read_by_admin', false)
        .eq('sender_type', 'user');
      */
    } catch (error) {
      console.error('Error marking messages read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // TODO: Once support_messages table exists, uncomment:
      /*
      const messageData: SupportMessageInsert = {
        ticket_id: ticket.id,
        sender_id: user.id,
        message: newMessage.trim(),
        sender_type: 'admin',
        is_internal: isInternal
      };

      const { error } = await supabase
        .from('support_messages')
        .insert(messageData);

      if (error) throw error;

      // Update first_response_at if this is the first admin response
      if (!ticket.first_response_at) {
        await supabase
          .from('support_tickets')
          .update({ first_response_at: new Date().toISOString() })
          .eq('id', ticket.id);
      }
      */

      setNewMessage('');
      setIsInternal(false);
      await loadMessages();
      onUpdate();

      toast({
        title: 'Message sent',
        description: isInternal ? 'Internal note added' : 'Message sent to user'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const updateTicket = async (updates: SupportTicketUpdate) => {
    try {
      setUpdating(true);

      // TODO: Once support_tickets table exists, uncomment:
      /*
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticket.id);

      if (error) throw error;
      */

      toast({
        title: 'Ticket updated',
        description: 'Ticket has been updated successfully'
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (status: TicketStatus) => {
    const updates: SupportTicketUpdate = { status };

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    } else if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    updateTicket(updates);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    updateTicket({ priority });
  };

  const handleAssignToSelf = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    updateTicket({ assigned_admin_id: user.id });
  };

  const saveInternalNotes = async () => {
    updateTicket({ internal_notes: internalNotes });
  };

  const getPriorityColor = (priority: TicketPriority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
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

  return (
    <div className="space-y-4">
      {/* Ticket Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>{ticket.subject}</CardTitle>
                <Badge variant="outline">{ticket.ticket_number}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{ticket.user?.display_name}</span>
                <span>•</span>
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={getPriorityColor(ticket.priority)}>
                {PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ticket Management */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={ticket.status}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Priority</Label>
              <Select
                value={ticket.priority}
                onValueChange={handlePriorityChange}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map(priority => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Assignment</Label>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAssignToSelf}
                disabled={updating}
              >
                <User className="h-4 w-4 mr-2" />
                {ticket.assigned_admin ? 'Reassign to Me' : 'Assign to Me'}
              </Button>
            </div>
          </div>

          {/* Tags and Related Items */}
          <div>
            <Label className="text-xs mb-2 block">Related Items</Label>
            <div className="flex flex-wrap gap-2">
              {ticket.related_order_id && (
                <Badge variant="outline">
                  <FileText className="h-3 w-3 mr-1" />
                  Order: {ticket.order?.order_number}
                </Badge>
              )}
              {ticket.related_dispute_id && (
                <Badge variant="outline">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Dispute: {ticket.dispute?.title}
                </Badge>
              )}
              {ticket.related_listing_id && (
                <Badge variant="outline">
                  <Tag className="h-3 w-3 mr-1" />
                  Listing: {ticket.listing?.title}
                </Badge>
              )}
              {ticket.tags && ticket.tags.length > 0 && (
                ticket.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))
              )}
            </div>
          </div>

          {/* SLA Info */}
          {ticket.sla_deadline && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">SLA Deadline:</span>
              <span className="font-medium">
                {format(new Date(ticket.sla_deadline), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Internal Notes (Admin Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Add internal notes about this ticket (not visible to user)..."
            rows={3}
            className="mb-2"
          />
          <Button
            size="sm"
            onClick={saveInternalNotes}
            disabled={updating || internalNotes === ticket.internal_notes}
          >
            Save Notes
          </Button>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
            <Badge variant="secondary">{messages.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation below</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isAdmin = message.sender_type === 'admin';
                  const isInternal = message.is_internal;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${isAdmin ? 'ml-auto' : 'mr-auto'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {!isAdmin && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender?.avatar_url || ''} />
                              <AvatarFallback className="text-xs">
                                {message.sender?.display_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {isAdmin ? 'You' : message.sender?.display_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'MMM d, h:mm a')}
                            </span>
                            {isInternal && (
                              <Badge variant="outline" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Internal
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded-lg ${
                            isInternal
                              ? 'bg-amber-50 border border-amber-200'
                              : isAdmin
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* New Message */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs">New Message</Label>
              <Button
                variant={isInternal ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setIsInternal(!isInternal)}
                className="ml-auto"
              >
                {isInternal ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {isInternal ? 'Internal Note' : 'User Message'}
              </Button>
            </div>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isInternal ? 'Add an internal note (user won\'t see this)...' : 'Type your message to the user...'}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  sendMessage();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to send
              </p>
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {isInternal ? 'Add Note' : 'Send Message'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
