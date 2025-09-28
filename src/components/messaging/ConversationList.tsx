import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Package } from "lucide-react";
import type { Conversation } from "@/pages/Messages";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

export const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation 
}: ConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-8">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-center">
            Start a conversation with a seller by visiting a product page and clicking "Message Seller".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant="ghost"
              className={`w-full p-4 h-auto flex-col items-start gap-3 rounded-none border-b hover:bg-muted/50 ${
                selectedConversation === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              {/* Conversation Header */}
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.other_user.avatar_url || ""} />
                  <AvatarFallback>
                    {conversation.other_user.display_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {conversation.other_user.display_name || "Anonymous User"}
                    </span>
                    {conversation.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  {conversation.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message.content}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Associated Listing */}
              {conversation.listing && (
                <div className="flex items-center gap-2 w-full p-2 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded overflow-hidden">
                    {conversation.listing.images?.[0] ? (
                      <img
                        src={conversation.listing.images[0]}
                        alt={conversation.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium truncate">
                      {conversation.listing.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${conversation.listing.price}
                    </p>
                  </div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};