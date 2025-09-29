import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Share2, 
  Copy, 
  Calendar, 
  DollarSign, 
  Package, 
  Users,
  ExternalLink,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SharedWishlist {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_image_url: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_avatar: string | null;
  occasion: string | null;
  target_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  item_count: number;
  total_value: number;
  purchased_value: number;
  contributor_count: number;
  view_count: number;
  is_public: boolean;
  share_token: string;
  created_at: string;
}

interface WishlistCardProps {
  wishlist: SharedWishlist;
  showCreator?: boolean;
  showProgress?: boolean;
  className?: string;
}

export const WishlistCard = ({ 
  wishlist, 
  showCreator = true,
  showProgress = true,
  className = '' 
}: WishlistCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copying, setCopying] = useState(false);

  const handleCardClick = () => {
    navigate(`/wishlists/${wishlist.slug}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopying(true);
    
    try {
      const shareUrl = `${window.location.origin}/wishlists/${wishlist.slug}?token=${wishlist.share_token}`;
      
      if (navigator.share) {
        await navigator.share({
          title: wishlist.title,
          text: wishlist.description || `Check out my wishlist: ${wishlist.title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "The wishlist link has been copied to your clipboard.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error sharing wishlist:', error);
      toast({
        title: "Error sharing",
        description: "Failed to share the wishlist. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setCopying(false);
    }
  };

  const getOccasionIcon = (occasion: string | null) => {
    switch (occasion?.toLowerCase()) {
      case 'birthday': return '🎂';
      case 'wedding': return '💒';
      case 'baby shower': return '👶';
      case 'holiday': return '🎄';
      case 'anniversary': return '💕';
      case 'graduation': return '🎓';
      default: return '🎁';
    }
  };

  const getOccasionColor = (occasion: string | null) => {
    switch (occasion?.toLowerCase()) {
      case 'birthday': return 'bg-pink-100 text-pink-800';
      case 'wedding': return 'bg-purple-100 text-purple-800';
      case 'baby shower': return 'bg-blue-100 text-blue-800';
      case 'holiday': return 'bg-green-100 text-green-800';
      case 'anniversary': return 'bg-red-100 text-red-800';
      case 'graduation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completionPercentage = wishlist.total_value > 0 
    ? Math.round((wishlist.purchased_value / wishlist.total_value) * 100)
    : 0;

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max && min !== max) return `$${min} - $${max}`;
    if (min) return `$${min}+`;
    if (max) return `Under $${max}`;
    return null;
  };

  const formatTargetDate = (date: string | null) => {
    if (!date) return null;
    const targetDate = new Date(date);
    const now = new Date();
    
    if (targetDate < now) {
      return `${formatDistanceToNow(targetDate)} ago`;
    } else {
      return `in ${formatDistanceToNow(targetDate)}`;
    }
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
        {wishlist.cover_image_url ? (
          <img
            src={wishlist.cover_image_url}
            alt={wishlist.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="text-6xl">
              {getOccasionIcon(wishlist.occasion)}
            </div>
          </div>
        )}
        
        {/* Occasion Badge */}
        {wishlist.occasion && (
          <Badge 
            className={`absolute top-2 left-2 ${getOccasionColor(wishlist.occasion)}`}
          >
            {wishlist.occasion}
          </Badge>
        )}
        
        {/* Share Button */}
        <Button
          onClick={handleShare}
          disabled={copying}
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          {copying ? (
            <Copy className="h-4 w-4" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
        </Button>

        {/* Progress Overlay */}
        {showProgress && completionPercentage > 0 && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black/50 rounded-lg p-2 text-white text-xs">
              <div className="flex items-center justify-between mb-1">
                <span>{completionPercentage}% complete</span>
                <span>${wishlist.purchased_value} / ${wishlist.total_value}</span>
              </div>
              <Progress value={completionPercentage} className="h-1" />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg leading-tight flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary flex-shrink-0" />
            {wishlist.title}
          </CardTitle>
          
          {wishlist.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {wishlist.description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Creator Info */}
        {showCreator && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={wishlist.creator_avatar || ''} />
              <AvatarFallback className="text-xs">
                {wishlist.creator_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              by {wishlist.creator_name || 'Anonymous'}
            </span>
          </div>
        )}

        {/* Target Date & Budget */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {wishlist.target_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatTargetDate(wishlist.target_date)}</span>
            </div>
          )}
          
          {formatBudget(wishlist.budget_min, wishlist.budget_max) && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{formatBudget(wishlist.budget_min, wishlist.budget_max)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>{wishlist.item_count} items</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{wishlist.contributor_count} contributors</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!wishlist.is_public && (
              <Badge variant="outline" className="text-xs">
                Private
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 hover:bg-transparent"
              onClick={handleCardClick}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && wishlist.total_value > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>${wishlist.purchased_value} purchased</span>
              <span>${wishlist.total_value - wishlist.purchased_value} remaining</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
