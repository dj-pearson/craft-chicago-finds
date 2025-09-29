import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  Paperclip,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Package,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface CustomOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id?: string;
  subject: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  status:
    | "open"
    | "in_progress"
    | "quoted"
    | "accepted"
    | "completed"
    | "cancelled";
  created_at: string;
  updated_at: string;
  buyer?: {
    display_name: string;
    avatar_url?: string;
  };
  seller?: {
    display_name: string;
    avatar_url?: string;
  };
  listing?: {
    title: string;
    images: string[];
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  attachments?: string[];
  message_type: "text" | "quote" | "system";
  quote_amount?: number;
  quote_details?: string;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface CustomOrderChatProps {
  orderId: string;
  className?: string;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "bg-blue-100 text-blue-800",
    icon: MessageCircle,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  quoted: {
    label: "Quoted",
    color: "bg-purple-100 text-purple-800",
    icon: DollarSign,
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
  },
};

export const CustomOrderChat = ({
  orderId,
  className = "",
}: CustomOrderChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteDetails, setQuoteDetails] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrder();
    loadMessages();
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_order_chats")
        .select(
          `
          *,
          buyer:profiles!custom_order_chats_buyer_id_fkey(display_name, avatar_url),
          seller:profiles!custom_order_chats_seller_id_fkey(display_name, avatar_url),
          listing:listings(title, images)
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      console.error("Error loading order:", error);
      toast({
        title: "Error loading order",
        description: error.message || "Failed to load order details.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would load from a messages table
      // For now, we'll simulate some messages
      const mockMessages: Message[] = [
        {
          id: "1",
          sender_id: order?.buyer_id || "buyer",
          content: order?.description || "Initial request",
          message_type: "text",
          created_at: order?.created_at || new Date().toISOString(),
          sender: order?.buyer,
        },
      ];

      setMessages(mockMessages);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !order) return;

    setSending(true);
    try {
      const message: Message = {
        id: `temp_${Date.now()}`,
        sender_id: user.id,
        content: newMessage,
        message_type: "text",
        created_at: new Date().toISOString(),
        sender: {
          display_name: user.email?.split("@")[0] || "You",
          avatar_url: undefined,
        },
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage("");

      // In a real implementation, this would save to database
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
        duration: 2000,
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSending(false);
    }
  };

  const sendQuote = async () => {
    if (!quoteAmount || !user || !order) return;

    try {
      const quote: Message = {
        id: `quote_${Date.now()}`,
        sender_id: user.id,
        content: `Quote: $${quoteAmount}`,
        message_type: "quote",
        quote_amount: parseFloat(quoteAmount),
        quote_details: quoteDetails,
        created_at: new Date().toISOString(),
        sender: {
          display_name: user.email?.split("@")[0] || "You",
          avatar_url: undefined,
        },
      };

      setMessages((prev) => [...prev, quote]);

      // Update order status
      await updateOrderStatus("quoted");

      setShowQuoteDialog(false);
      setQuoteAmount("");
      setQuoteDetails("");

      toast({
        title: "Quote sent",
        description: "Your quote has been sent to the buyer.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error("Error sending quote:", error);
      toast({
        title: "Error sending quote",
        description: error.message || "Failed to send quote.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const updateOrderStatus = async (newStatus: CustomOrder["status"]) => {
    if (!order || !user) return;

    try {
      const { error } = await supabase
        .from("custom_order_chats")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));

      // Add system message
      const systemMessage: Message = {
        id: `system_${Date.now()}`,
        sender_id: "system",
        content: `Order status updated to ${STATUS_CONFIG[newStatus].label}`,
        message_type: "system",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, systemMessage]);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error updating status",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // In a real implementation, this would upload files to storage
    toast({
      title: "File upload",
      description: "File upload functionality will be available soon.",
      duration: 3000,
    });
  };

  const isSeller = user?.id === order?.seller_id;
  const isBuyer = user?.id === order?.buyer_id;
  const canSendQuote = isSeller && order?.status === "open";
  const canAcceptQuote = isBuyer && order?.status === "quoted";

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p>Loading conversation...</p>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p>Order not found or you don't have access to this conversation.</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {order.subject}
            </CardTitle>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {isSeller
                    ? `From: ${order.buyer?.display_name}`
                    : `To: ${order.seller?.display_name}`}
                </span>
              </div>

              {order.listing && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Re: {order.listing.title}</span>
                </div>
              )}
            </div>
          </div>

          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {order.budget_min && order.budget_max && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                Budget: ${order.budget_min} - ${order.budget_max}
              </span>
            </div>
          )}

          {order.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Deadline: {new Date(order.deadline).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              Created {formatDistanceToNow(new Date(order.created_at))} ago
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender?.avatar_url} />
                <AvatarFallback>
                  {message.sender_id === "system"
                    ? "S"
                    : message.sender?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user?.id
                    ? "bg-primary text-primary-foreground"
                    : message.message_type === "system"
                    ? "bg-muted text-muted-foreground text-center"
                    : message.message_type === "quote"
                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                    : "bg-background border"
                }`}
              >
                {message.message_type === "quote" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      Quote: ${message.quote_amount}
                    </div>
                    {message.quote_details && (
                      <p className="text-sm">{message.quote_details}</p>
                    )}
                  </div>
                )}

                {message.message_type !== "quote" && (
                  <p className="text-sm">{message.content}</p>
                )}

                <p className="text-xs opacity-70 mt-1">
                  {formatDistanceToNow(new Date(message.created_at))} ago
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Actions */}
        {(order.status === "open" ||
          order.status === "in_progress" ||
          order.status === "quoted") && (
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              {canSendQuote && (
                <Dialog
                  open={showQuoteDialog}
                  onOpenChange={setShowQuoteDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Send Quote
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Quote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quote-amount">Quote Amount ($)</Label>
                        <Input
                          id="quote-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={quoteAmount}
                          onChange={(e) => setQuoteAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quote-details">
                          Details (optional)
                        </Label>
                        <Textarea
                          id="quote-details"
                          value={quoteDetails}
                          onChange={(e) => setQuoteDetails(e.target.value)}
                          placeholder="Include timeline, materials, or other details..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowQuoteDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={sendQuote} disabled={!quoteAmount}>
                          Send Quote
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {canAcceptQuote && (
                <Button
                  onClick={() => updateOrderStatus("accepted")}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accept Quote
                </Button>
              )}

              {(isSeller || isBuyer) &&
                order.status !== "completed" &&
                order.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    onClick={() => updateOrderStatus("completed")}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Complete
                  </Button>
                )}
            </div>

            <Separator />

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="gap-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {(order.status === "completed" || order.status === "cancelled") && (
          <div className="text-center py-4 text-muted-foreground">
            <StatusIcon className="h-8 w-8 mx-auto mb-2" />
            <p>This conversation has been {order.status}.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
