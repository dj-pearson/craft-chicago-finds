import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";

export interface Conversation {
  id: string;
  listing_id?: string;
  other_user_id: string;
  other_user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  listing?: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
  updated_at: string;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all messages where user is either sender or receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read_at,
          listing_id,
          listings (
            id,
            title,
            images,
            price
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation and get the latest message for each
      const conversationMap = new Map<string, any>();
      
      for (const message of messagesData || []) {
        const convId = message.conversation_id;
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            id: convId,
            other_user_id: otherUserId,
            listing: message.listings,
            last_message: message,
            unread_count: 0,
            messages: []
          });
        }
        
        const conv = conversationMap.get(convId);
        conv.messages.push(message);
        
        // Count unread messages (where user is receiver and read_at is null)
        if (message.receiver_id === user.id && !message.read_at) {
          conv.unread_count++;
        }
      }

      // Get user profiles for all other users
      const otherUserIds = Array.from(conversationMap.values()).map(conv => conv.other_user_id);
      
      if (otherUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', otherUserIds);

        if (profilesError) throw profilesError;

        // Map profiles to conversations
        const conversations = Array.from(conversationMap.values()).map(conv => {
          const profile = profilesData?.find(p => p.user_id === conv.other_user_id);
          return {
            id: conv.id,
            other_user_id: conv.other_user_id,
            other_user: {
              id: conv.other_user_id,
              display_name: profile?.display_name || 'Unknown User',
              avatar_url: profile?.avatar_url || null
            },
            listing: conv.listing,
            last_message: conv.last_message,
            unread_count: conv.unread_count,
            updated_at: conv.last_message?.created_at || new Date().toISOString()
          };
        });

        // Sort by last message date
        conversations.sort((a, b) => {
          const dateA = a.last_message ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message ? new Date(b.last_message.created_at) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setConversations(conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <MessageCircle className="h-8 w-8" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Communicate with buyers and sellers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-16rem)]">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <ChatWindow
              conversationId={selectedConversation}
              currentUser={user}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;