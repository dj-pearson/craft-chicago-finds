import { useState, useEffect } from 'react';
import { useDisputes, Dispute, DisputeMessage } from '@/hooks/useDisputes';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DisputeDetailProps {
  disputeId: string;
  onBack: () => void;
}

export function DisputeDetail({ disputeId, onBack }: DisputeDetailProps) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { disputes, updateDisputeStatus, getDisputeMessages, sendDisputeMessage } = useDisputes();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState<Dispute['status']>('open');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const foundDispute = disputes.find(d => d.id === disputeId);
    if (foundDispute) {
      setDispute(foundDispute);
      setNewStatus(foundDispute.status);
      loadMessages();
    }
  }, [disputeId, disputes]);

  const loadMessages = async () => {
    try {
      const msgs = await getDisputeMessages(disputeId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await sendDisputeMessage(disputeId, newMessage);
      setNewMessage('');
      await loadMessages();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!dispute) return;

    setIsUpdating(true);
    try {
      await updateDisputeStatus(disputeId, newStatus, resolutionNotes);
      toast.success('Dispute status updated');
      setResolutionNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4" />;
      case 'in_review':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_review':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  if (!dispute) {
    return <div className="text-center py-8">Dispute not found</div>;
  }

  // Admin check uses the proper role-based system from useAdmin hook
  const canUpdateStatus = isAdmin || user?.id === dispute.disputing_user_id || user?.id === dispute.disputed_user_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Disputes
        </Button>
        <Badge variant={getStatusColor(dispute.status) as any} className="flex items-center gap-1">
          {getStatusIcon(dispute.status)}
          {dispute.status.replace('_', ' ')}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dispute.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Type:</span> {dispute.dispute_type}
            </div>
            <div>
              <span className="font-medium">Order ID:</span> {dispute.order_id}
            </div>
            <div>
              <span className="font-medium">Created:</span> {format(new Date(dispute.created_at), 'MMM d, yyyy HH:mm')}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {format(new Date(dispute.updated_at), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Description:</span>
            <p className="mt-1 text-muted-foreground">{dispute.description}</p>
          </div>

          {dispute.admin_notes && (
            <div>
              <span className="font-medium">Admin Notes:</span>
              <p className="mt-1 text-muted-foreground">{dispute.admin_notes}</p>
            </div>
          )}

          {dispute.resolution_notes && (
            <div>
              <span className="font-medium">Resolution Notes:</span>
              <p className="mt-1 text-muted-foreground">{dispute.resolution_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canUpdateStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as Dispute['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {newStatus === 'resolved' && (
              <Textarea
                placeholder="Resolution notes..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            )}

            <Button onClick={handleUpdateStatus} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-muted mr-12'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">
                    {message.sender_type === 'admin' ? 'Admin' : 'User'}
                  </span>
                  <span>{format(new Date(message.created_at), 'MMM d, HH:mm')}</span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isSendingMessage || !newMessage.trim()}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}