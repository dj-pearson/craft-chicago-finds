import { useState } from 'react';
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

  if (!user || user.id === sellerId) {
    return null;
  }

  const handleFollow = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // TODO: Implement shop following when shop_follows table is created
      console.log('Shop follow functionality not yet implemented');
      
      toast({
        title: "Feature coming soon",
        description: "Shop following will be available soon!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error following shop:', error);
      toast({
        title: "Error",
        description: "Failed to follow shop. Please try again.",
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
          <Users className="h-4 w-4" />
          <span>{followerCount}</span>
        </>
      )}
    </Button>
  );
};