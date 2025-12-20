import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FollowShopButtonProps {
  sellerId: string;
  sellerName: string;
  className?: string;
}

export const FollowShopButton = ({
  sellerId,
  sellerName,
  className = ''
}: FollowShopButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check if user is already following and get follower count
  useEffect(() => {
    if (!user || user.id === sellerId) return;

    const checkFollowStatus = async () => {
      try {
        // Check if following
        const { data: followData } = await supabase
          .from('shop_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('shop_owner_id', sellerId)
          .single();

        setIsFollowing(!!followData);

        // Get follower count
        const { count } = await supabase
          .from('shop_follows')
          .select('*', { count: 'exact', head: true })
          .eq('shop_owner_id', sellerId);

        setFollowerCount(count || 0);
      } catch (error) {
        // Ignore errors for non-existent follow records
      }
    };

    checkFollowStatus();
  }, [user, sellerId]);

  if (!user || user.id === sellerId) {
    return null;
  }

  const handleFollow = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('shop_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('shop_owner_id', sellerId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));

        toast({
          title: "Unfollowed",
          description: `You're no longer following ${sellerName}`,
          duration: 3000,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('shop_follows')
          .insert({
            follower_id: user.id,
            shop_owner_id: sellerId,
            notification_enabled: true
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);

        toast({
          title: "Following!",
          description: `You're now following ${sellerName}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error following/unfollowing shop:', error);
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

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "secondary" : "default"}
      className={`gap-2 ${className}`}
      size="sm"
    >
      <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
      {followerCount > 0 && (
        <>
          <Users className="h-4 w-4 ml-1" />
          <span>{followerCount}</span>
        </>
      )}
    </Button>
  );
};