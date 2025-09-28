import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
  created_at: string;
  read_at?: string;
}

interface ChatWindowProps {
  conversationId: string | null;
  currentUser: User;
}

export const ChatWindow = ({ conversationId, currentUser }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      fetchConversationInfo();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    // TODO: Implement message fetching from Supabase
    // For now, using mock data
    const mockMessages: Message[] = [
      {
        id: "msg-1",
        content: "Hi! I'm interested in this ceramic vase. Is it still available?",
        sender_id: currentUser.id,
        receiver_id: "user-2",
        conversation_id: conversationId,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "msg-2",
        content: "Yes, it's still available! It's one of my newest pieces. Would you like to know more about it?",
        sender_id: "user-2",
        receiver_id: currentUser.id,
        conversation_id: conversationId,
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: "msg-3",
        content: "That would be great! What are the dimensions and what type of clay did you use?",
        sender_id: currentUser.id,
        receiver_id: "user-2",
        conversation_id: conversationId,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];

    setMessages(mockMessages);
  };

  const fetchConversationInfo = async () => {
    if (!conversationId) return;

    // TODO: Implement conversation info fetching
    // Mock data for now
    setConversationInfo({
      other_user: {
        id: "user-2",
        display_name: "Sarah Chen",
        avatar_url: null,
      },
      listing: {
        id: "listing-1",
        title: "Handmade Ceramic Vase",
        images: ["/api/placeholder/200/200"],
        price: 45.00,
      },
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || loading) return;

    setLoading(true);
    try {
      // TODO: Implement message sending to Supabase
      const mockMessage: Message = {
        id: `msg-${Date.now()}`,
        content: newMessage.trim(),
        sender_id: currentUser.id,
        receiver_id: conversationInfo?.other_user?.id || "",
        conversation_id: conversationId,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, mockMessage]);
      setNewMessage("");

      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversationId) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-8">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
          <p className="text-muted-foreground text-center">
            Choose a conversation from the list to start messaging.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          {conversationInfo?.other_user && (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={conversationInfo.other_user.avatar_url || ""} />
                <AvatarFallback>
                  {conversationInfo.other_user.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">
                  {conversationInfo.other_user.display_name || "Anonymous User"}
                </div>
                {conversationInfo.listing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span>{conversationInfo.listing.title}</span>
                    <span className="font-medium">${conversationInfo.listing.price}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col min-h-0 p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUser.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.sender_id === currentUser.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender_id === currentUser.id
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};