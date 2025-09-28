import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  conversation_id?: string;
  created_at: string;
  read_at?: string;
  order_id?: string;
  listing_id?: string;
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

    try {
      setLoading(true);
      
      // Get all messages for this conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          read_at,
          order_id,
          listing_id
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Add conversation_id to messages
      const messagesWithConversation = (messagesData || []).map(msg => ({
        ...msg,
        conversation_id: conversationId
      }));
      
      setMessages(messagesWithConversation);

      // Mark messages as read
      const unreadMessages = messagesData?.filter(
        msg => msg.receiver_id === currentUser.id && !msg.read_at
      ) || [];

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Failed to load messages",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationInfo = async () => {
    if (!conversationId) return;

    try {
      // Get the first message to determine other user and listing
      const { data: messageData, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          listing_id,
          listings (
            id,
            title,
            images,
            price
          )
        `)
        .eq('conversation_id', conversationId)
        .limit(1)
        .single();

      if (error) throw error;

      const otherUserId = messageData.sender_id === currentUser.id 
        ? messageData.receiver_id 
        : messageData.sender_id;

      // Get other user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', otherUserId)
        .single();

      if (profileError) throw profileError;

      setConversationInfo({
        other_user: {
          id: otherUserId,
          display_name: profileData.display_name || 'Unknown User',
          avatar_url: profileData.avatar_url
        },
        listing: messageData.listings
      });
    } catch (error) {
      console.error('Error fetching conversation info:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || loading || !conversationInfo?.other_user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          receiver_id: conversationInfo.other_user.id,
          content: newMessage.trim(),
          listing_id: conversationInfo.listing?.id || null
        });

      if (error) throw error;

      setNewMessage("");
      
      // Refresh messages to get the new one
      fetchMessages();

      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
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