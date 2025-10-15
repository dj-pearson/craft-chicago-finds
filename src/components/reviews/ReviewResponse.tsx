import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, User } from "lucide-react";
import { format } from "date-fns";

interface ReviewResponseProps {
  reviewId: string;
  sellerId: string;
  existingResponse?: {
    id: string;
    response_text: string;
    created_at: string;
    seller_profile?: {
      display_name: string;
    };
  } | null;
  canRespond: boolean;
  onResponseAdded?: () => void;
}

export const ReviewResponse = ({ 
  reviewId, 
  sellerId, 
  existingResponse, 
  canRespond,
  onResponseAdded 
}: ReviewResponseProps) => {
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || responseText.length < 10) {
      toast({
        title: "Response too short",
        description: "Please write at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    if (responseText.length > 1000) {
      toast({
        title: "Response too long",
        description: "Please keep your response under 1000 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('review_responses')
        .insert({
          review_id: reviewId,
          seller_id: user.id,
          response_text: responseText.trim()
        });

      if (error) throw error;

      toast({
        title: "Response posted",
        description: "Your response has been published.",
      });

      setResponseText("");
      setIsResponding(false);
      onResponseAdded?.();
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post response.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Display existing response
  if (existingResponse) {
    return (
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500 mt-3">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white p-2 rounded-full">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Seller Response
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(existingResponse.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{existingResponse.response_text}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show respond button if seller can respond
  if (canRespond && !isResponding) {
    return (
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsResponding(true)}
          className="w-full sm:w-auto"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Respond to Review
        </Button>
      </div>
    );
  }

  // Show response form
  if (canRespond && isResponding) {
    return (
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500 mt-3">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Your Response</span>
            </div>
            <Textarea
              placeholder="Write a professional response to this review. Be courteous and address any concerns raised..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {responseText.length}/1000 characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsResponding(false);
                    setResponseText("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitResponse}
                  disabled={loading || responseText.trim().length < 10}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Response
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
