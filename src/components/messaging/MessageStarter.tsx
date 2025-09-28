import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MessageStarterProps {
  sellerId: string;
  listingId?: string;
  sellerName: string;
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export const MessageStarter = ({ 
  sellerId, 
  listingId, 
  sellerName, 
  buttonText = "Message Seller",
  variant = "outline"
}: MessageStarterProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send a message to yourself.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create conversation ID (consistent ordering)
      const conversationId = [user.id, sellerId, listingId || ''].sort().join('-');

      // Insert message
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: sellerId,
          content: message.trim(),
          listing_id: listingId || null
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: `Your message has been sent to ${sellerName}.`,
      });

      setOpen(false);
      setMessage("");
      
      // Navigate to messages page
      navigate("/messages");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!user && newOpen) {
      navigate("/auth");
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {sellerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${sellerName}, I'm interested in this item...`}
              rows={4}
              maxLength={1000}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              className="flex-1"
              disabled={loading || !message.trim()}
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};