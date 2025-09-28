import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
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
    // TODO: Implement conversation fetching from Supabase
    // For now, using mock data
    const mockConversations: Conversation[] = [
      {
        id: "conv-1",
        listing_id: "listing-1",
        other_user_id: "user-2",
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
        last_message: {
          content: "Is this still available?",
          created_at: new Date().toISOString(),
          sender_id: user?.id || "",
        },
        unread_count: 1,
        updated_at: new Date().toISOString(),
      },
    ];
    
    setConversations(mockConversations);
    setLoading(false);
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