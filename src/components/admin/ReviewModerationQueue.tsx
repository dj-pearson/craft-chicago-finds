import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Star, Clock, Eye } from "lucide-react";
import { format } from "date-fns";

interface PendingReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string | null;
  photos: string[] | null;
  created_at: string;
  reviewer_profile?: {
    display_name: string;
  };
  seller_profile?: {
    display_name: string;
  };
  order?: {
    id: string;
  };
}

export const ReviewModerationQueue = () => {
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const reviewsWithProfiles = await Promise.all((data || []).map(async (review) => {
        const [reviewer, seller] = await Promise.all([
          supabase.from('profiles').select('display_name').eq('user_id', review.reviewer_id).single(),
          supabase.from('profiles').select('display_name').eq('user_id', review.reviewed_user_id).single()
        ]);

        return {
          ...review,
          reviewer_profile: reviewer.data || { display_name: 'Anonymous' },
          seller_profile: seller.data || { display_name: 'Unknown' }
        };
      }));

      setPendingReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load pending reviews.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (reviewId: string, action: 'approved' | 'rejected') => {
    try {
      setProcessingId(reviewId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reviews')
        .update({
          status: action,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: moderationNotes[reviewId] || null
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: action === 'approved' ? 'Review approved' : 'Review rejected',
        description: `The review has been ${action}.`,
      });

      // Remove from list
      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
      setModerationNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[reviewId];
        return newNotes;
      });
    } catch (error) {
      console.error('Error moderating review:', error);
      toast({
        title: "Error",
        description: "Failed to moderate review.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Review Moderation Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading pending reviews...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Review Moderation Queue
          <Badge variant="secondary" className="ml-2">
            {pendingReviews.length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No reviews pending moderation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <Card key={review.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Review Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-muted-foreground">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">From:</span>{' '}
                          {review.reviewer_profile?.display_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">For:</span>{' '}
                          {review.seller_profile?.display_name || 'Unknown Seller'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50">
                        Pending Review
                      </Badge>
                    </div>

                    {/* Review Comment */}
                    {review.comment && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                      </div>
                    )}

                    {/* Review Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {review.photos.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Review photo ${idx + 1}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    )}

                    {/* Moderation Notes */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Moderation Notes (Optional)
                      </label>
                      <Textarea
                        placeholder="Add internal notes about this review..."
                        value={moderationNotes[review.id] || ''}
                        onChange={(e) => setModerationNotes(prev => ({
                          ...prev,
                          [review.id]: e.target.value
                        }))}
                        rows={2}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleModeration(review.id, 'approved')}
                        disabled={processingId === review.id}
                        className="flex-1"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleModeration(review.id, 'rejected')}
                        disabled={processingId === review.id}
                        className="flex-1"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
