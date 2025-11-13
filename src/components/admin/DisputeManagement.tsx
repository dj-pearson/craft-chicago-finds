import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Scale, CheckCircle, XCircle, Eye, MessageSquare, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Dispute {
  id: string;
  order_id: string;
  disputing_user_id: string;
  disputed_user_id: string;
  dispute_type: string;
  status: string;
  title: string;
  description: string;
  evidence_urls: string[];
  admin_notes: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

export const DisputeManagement = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolutionData, setResolutionData] = useState<{
    notes: string;
    refundAmount?: string;
  }>({ notes: '' });
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, []);

  useEffect(() => {
    if (selectedDispute) {
      fetchMessages(selectedDispute.id);
    }
  }, [selectedDispute]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .in('status', ['open', 'in_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (disputeId: string) => {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('dispute_messages')
        .insert({
          dispute_id: selectedDispute.id,
          sender_id: user.id,
          message: newMessage.trim(),
          sender_type: 'admin'
        });

      if (error) throw error;

      setNewMessage("");
      await fetchMessages(selectedDispute.id);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the parties.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const resolveDispute = async (status: 'resolved' | 'closed') => {
    if (!selectedDispute || !resolutionData.notes) {
      toast({
        title: "Missing information",
        description: "Please add resolution notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingId(selectedDispute.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the resolve-dispute edge function
      const { error } = await supabase.functions.invoke('resolve-dispute', {
        body: {
          disputeId: selectedDispute.id,
          resolution: status === 'resolved' ? 'refund' : 'deny',
          resolutionNotes: resolutionData.notes,
          refundAmount: resolutionData.refundAmount ? parseFloat(resolutionData.refundAmount) : undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Dispute resolved",
        description: `The dispute has been ${status}.`,
      });

      setSelectedDispute(null);
      setResolutionData({ notes: '' });
      await fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quality: 'Quality Issue',
      shipping: 'Shipping Issue',
      payment: 'Payment Issue',
      description: 'Not as Described',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Dispute Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading disputes...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Disputes List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Open Disputes
            <Badge variant="secondary" className="ml-2">
              {disputes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No open disputes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {disputes.map((dispute) => (
                <Button
                  key={dispute.id}
                  variant={selectedDispute?.id === dispute.id ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(dispute.status)} variant="secondary">
                        {dispute.status}
                      </Badge>
                      <Badge variant="outline">
                        {getDisputeTypeLabel(dispute.dispute_type)}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm truncate">{dispute.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Details */}
      {selectedDispute ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedDispute.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(selectedDispute.status)}>
                    {selectedDispute.status}
                  </Badge>
                  <Badge variant="outline">
                    {getDisputeTypeLabel(selectedDispute.dispute_type)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Order #{selectedDispute.order_id.slice(0, 8)}
                  </span>
                </div>
              </div>
              {selectedDispute.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { error } = await supabase
                      .from('disputes')
                      .update({ status: 'in_review' })
                      .eq('id', selectedDispute.id);
                    
                    if (!error) {
                      setSelectedDispute({ ...selectedDispute, status: 'in_review' });
                      await fetchDisputes();
                      toast({
                        title: "Status updated",
                        description: "Dispute marked as in review.",
                      });
                    }
                  }}
                >
                  Mark In Review
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedDispute.description}</p>
              </div>
            </div>

            {/* Evidence */}
            {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Evidence ({selectedDispute.evidence_urls.length})
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {selectedDispute.evidence_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${idx + 1}`}
                        className="h-24 w-24 object-cover rounded border group-hover:ring-2 ring-primary"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication
              </h3>
              <div className="space-y-3 mb-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No messages yet
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_type === 'admin'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.sender_type === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Send a message to the parties..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
            </div>

            {/* Resolution */}
            {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Resolve Dispute
                </h3>
                
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Refund Amount (Optional)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={resolutionData.refundAmount || ''}
                    onChange={(e) => setResolutionData(prev => ({
                      ...prev,
                      refundAmount: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Resolution Notes (Required)
                  </label>
                  <Textarea
                    placeholder="Explain your decision and actions taken..."
                    value={resolutionData.notes}
                    onChange={(e) => setResolutionData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => resolveDispute('resolved')}
                    disabled={processingId === selectedDispute.id}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve in Buyer's Favor
                  </Button>
                  <Button
                    onClick={() => resolveDispute('closed')}
                    disabled={processingId === selectedDispute.id}
                    className="flex-1"
                    variant="outline"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Deny Dispute
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a dispute to view details</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
