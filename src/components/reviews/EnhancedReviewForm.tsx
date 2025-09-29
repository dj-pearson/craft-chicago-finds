import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Star, 
  Upload, 
  X, 
  Camera, 
  Package, 
  Truck, 
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedReviewFormProps {
  orderId: string;
  sellerId: string;
  buyerId: string;
  productTitle: string;
  onSubmit: () => void;
  onCancel: () => void;
}

interface ReviewAttributes {
  fit?: 'too_small' | 'perfect' | 'too_large';
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  packaging?: 'poor' | 'fair' | 'good' | 'excellent';
  shipping_speed?: 'slow' | 'as_expected' | 'fast';
  value_for_money?: 'poor' | 'fair' | 'good' | 'excellent';
  would_recommend?: boolean;
}

const ATTRIBUTE_OPTIONS = {
  fit: [
    { value: 'too_small', label: 'Too Small', icon: '📏' },
    { value: 'perfect', label: 'Perfect Fit', icon: '✨' },
    { value: 'too_large', label: 'Too Large', icon: '📐' }
  ],
  quality: [
    { value: 'poor', label: 'Poor', icon: '👎' },
    { value: 'fair', label: 'Fair', icon: '👌' },
    { value: 'good', label: 'Good', icon: '👍' },
    { value: 'excellent', label: 'Excellent', icon: '⭐' }
  ],
  packaging: [
    { value: 'poor', label: 'Poor', icon: '📦' },
    { value: 'fair', label: 'Fair', icon: '📦' },
    { value: 'good', label: 'Good', icon: '🎁' },
    { value: 'excellent', label: 'Excellent', icon: '🎁' }
  ],
  shipping_speed: [
    { value: 'slow', label: 'Slow', icon: '🐌' },
    { value: 'as_expected', label: 'As Expected', icon: '⏰' },
    { value: 'fast', label: 'Fast', icon: '⚡' }
  ],
  value_for_money: [
    { value: 'poor', label: 'Poor Value', icon: '💸' },
    { value: 'fair', label: 'Fair Value', icon: '💰' },
    { value: 'good', label: 'Good Value', icon: '💎' },
    { value: 'excellent', label: 'Great Value', icon: '🏆' }
  ]
};

export const EnhancedReviewForm = ({ 
  orderId, 
  sellerId, 
  buyerId, 
  productTitle,
  onSubmit, 
  onCancel 
}: EnhancedReviewFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [shippingRating, setShippingRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [attributes, setAttributes] = useState<ReviewAttributes>({});

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload up to 5 images per review",
        variant: "destructive"
      });
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (category: keyof ReviewAttributes, value: any) => {
    setAttributes(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const renderStarRating = (
    rating: number, 
    setRating: (rating: number) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderAttributeSelector = (
    category: keyof ReviewAttributes,
    title: string,
    options: typeof ATTRIBUTE_OPTIONS.quality
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={attributes[category] === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleAttributeChange(category, option.value)}
            className="text-xs"
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );

  const submitReview = async () => {
    if (overallRating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(`reviews/${fileName}`, image);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(`reviews/${fileName}`);

          imageUrls.push(publicUrl);
        }
      }

      // Create enhanced review
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: orderId,
          reviewer_id: buyerId,
          reviewed_user_id: sellerId,
          rating: overallRating,
          quality_rating: qualityRating || null,
          packaging_rating: packagingRating || null,
          shipping_rating: shippingRating || null,
          comment: comment.trim() || null,
          review_type: 'seller',
          photos: imageUrls.length > 0 ? imageUrls : null,
          attributes: Object.keys(attributes).length > 0 ? attributes : null,
          verified_purchase: true
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your detailed feedback!",
      });

      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Failed to submit review",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Review: {productTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        {renderStarRating(overallRating, setOverallRating, "Overall Rating *")}

        <Separator />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderStarRating(qualityRating, setQualityRating, "Quality")}
          {renderStarRating(packagingRating, setPackagingRating, "Packaging")}
          {renderStarRating(shippingRating, setShippingRating, "Shipping")}
        </div>

        <Separator />

        {/* Quick Attributes */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Quick Tags (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderAttributeSelector('quality', 'Product Quality', ATTRIBUTE_OPTIONS.quality)}
            {renderAttributeSelector('packaging', 'Packaging', ATTRIBUTE_OPTIONS.packaging)}
            {renderAttributeSelector('shipping_speed', 'Shipping Speed', ATTRIBUTE_OPTIONS.shipping_speed)}
            {renderAttributeSelector('value_for_money', 'Value for Money', ATTRIBUTE_OPTIONS.value_for_money)}
          </div>
          
          {/* Recommendation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Would you recommend this?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={attributes.would_recommend === true ? "default" : "outline"}
                size="sm"
                onClick={() => handleAttributeChange('would_recommend', true)}
                className="text-xs"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Yes
              </Button>
              <Button
                type="button"
                variant={attributes.would_recommend === false ? "default" : "outline"}
                size="sm"
                onClick={() => handleAttributeChange('would_recommend', false)}
                className="text-xs"
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                No
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Photo Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Add Photos (Optional)</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Review image ${index + 1}`}
                  className="w-20 h-20 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <Camera className="h-6 w-6 text-muted-foreground" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Upload up to 5 photos to help other buyers
          </p>
        </div>

        <Separator />

        {/* Written Review */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            Written Review (Optional)
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product and seller..."
            className="min-h-[100px]"
            maxLength={1000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {comment.length}/1000 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={submitReview}
            disabled={loading || overallRating === 0}
            className="flex-1"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
