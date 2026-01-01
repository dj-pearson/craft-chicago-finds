import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReviewResponse } from "@/components/reviews/ReviewResponse";
import { sanitizeText } from "@/lib/sanitize";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  photos?: string[];
  created_at: string;
  reviewed_user_id: string;
  reviewer: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ReviewDisplayProps {
  reviews: Review[];
  onResponseAdded?: () => void;
}

export const ReviewDisplay = ({ reviews, onResponseAdded }: ReviewDisplayProps) => {
  const { user } = useAuth();
  const [responses, setResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchResponses();
  }, [reviews]);

  const fetchResponses = async () => {
    if (reviews.length === 0) return;

    const reviewIds = reviews.map(r => r.id);
    const { data } = await supabase
      .from('review_responses')
      .select('*')
      .in('review_id', reviewIds);

    if (data) {
      const responsesMap: Record<string, any> = {};
      data.forEach(response => {
        responsesMap[response.review_id] = response;
      });
      setResponses(responsesMap);
    }
  };

  // Memoize expensive calculations to avoid recalculating on every render
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  // Memoize rating distribution to avoid multiple filter operations on every render
  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = reviews.filter(r => r.rating === rating).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { rating, count, percentage };
    });
  }, [reviews]);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        <div className="flex-1">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-2 text-sm">
              <span className="w-8">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.reviewer.avatar_url || ""} />
                  <AvatarFallback>
                    {review.reviewer.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {review.reviewer.display_name || "Anonymous"}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-foreground mb-3 leading-relaxed">
                      {sanitizeText(review.comment)}
                    </p>
                  )}
                  
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {review.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Review Response */}
              <ReviewResponse
                reviewId={review.id}
                sellerId={review.reviewed_user_id}
                existingResponse={responses[review.id]}
                canRespond={user?.id === review.reviewed_user_id}
                onResponseAdded={() => {
                  fetchResponses();
                  onResponseAdded?.();
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};