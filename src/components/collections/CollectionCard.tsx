import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Eye, Package, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Collection {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  cover_image_url: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_avatar: string | null;
  category: string | null;
  is_featured: boolean;
  item_count: number;
  follow_count: number;
  view_count: number;
  created_at: string;
  is_following?: boolean;
}

interface CollectionCardProps {
  collection: Collection;
  showCreator?: boolean;
  className?: string;
}

export const CollectionCard = ({ 
  collection, 
  showCreator = true,
  className = '' 
}: CollectionCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isFollowing, setIsFollowing] = useState(collection.is_following || false);
  const [followCount, setFollowCount] = useState(collection.follow_count);
  const [loading, setLoading] = useState(false);

  // Check if user is already following this collection
  useEffect(() => {
    if (!user || user.id === collection.creator_id) return;

    const checkFollowStatus = async () => {
      try {
        // Check if following
        const { data: followData } = await supabase
          .from('collection_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('collection_id', collection.id)
          .single();

        setIsFollowing(!!followData);

        // Get updated follower count
        const { count } = await supabase
          .from('collection_follows')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);

        setFollowCount(count || collection.follow_count);
      } catch (error) {
        // Ignore errors for non-existent follow records
      }
    };

    checkFollowStatus();
  }, [user, collection.id, collection.creator_id, collection.follow_count]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow collections and get updates.",
        duration: 4000,
      });
      return;
    }

    if (user.id === collection.creator_id) {
      toast({
        title: "Can't follow your own collection",
        description: "You can't follow collections you created.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('collection_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('collection_id', collection.id);

        if (error) throw error;

        setIsFollowing(false);
        setFollowCount(prev => Math.max(0, prev - 1));

        toast({
          title: "Unfollowed",
          description: `You're no longer following "${collection.title}"`,
          duration: 3000,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('collection_follows')
          .insert({
            follower_id: user.id,
            collection_id: collection.id,
            notification_enabled: true
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowCount(prev => prev + 1);

        toast({
          title: "Following!",
          description: `You'll get updates about "${collection.title}"`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing collection:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/collections/${collection.slug}`);
  };

  const getCategoryBadgeColor = (category: string | null) => {
    switch (category) {
      case 'curated': return 'bg-purple-100 text-purple-800';
      case 'seasonal': return 'bg-orange-100 text-orange-800';
      case 'trending': return 'bg-red-100 text-red-800';
      case 'gift_guide': return 'bg-green-100 text-green-800';
      case 'style': return 'bg-blue-100 text-blue-800';
      case 'occasion': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategoryName = (category: string | null) => {
    if (!category) return 'Custom';
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${className}`}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
        {collection.cover_image_url ? (
          <img
            src={collection.cover_image_url}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Featured Badge */}
        {collection.is_featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-50">
            Featured
          </Badge>
        )}
        
        {/* Category Badge */}
        {collection.category && (
          <Badge 
            variant="secondary" 
            className={`absolute top-2 right-2 ${getCategoryBadgeColor(collection.category)}`}
          >
            {formatCategoryName(collection.category)}
          </Badge>
        )}
        
        {/* Follow Button Overlay */}
        {user?.id !== collection.creator_id && (
          <Button
            onClick={handleFollow}
            disabled={loading}
            size="sm"
            variant={isFollowing ? "secondary" : "default"}
            className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isFollowing ? 'bg-white text-primary border border-primary' : ''
            }`}
          >
            <Heart className={`h-4 w-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
            {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg leading-tight">
            {collection.title}
          </CardTitle>
          
          {collection.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Creator Info */}
        {showCreator && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={collection.creator_avatar || ''} />
              <AvatarFallback className="text-xs">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              by {collection.creator_name || 'Unknown Creator'}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span>{collection.item_count}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{followCount}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{collection.view_count}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">
              {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};