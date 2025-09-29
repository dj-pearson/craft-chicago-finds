import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Heart, Bell, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FollowShopButtonProps {
  shopOwnerId: string;
  shopName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showFollowerCount?: boolean;
}

interface NotificationPreferences {
  new_items: boolean;
  sales: boolean;
  updates: boolean;
}

export const FollowShopButton = ({
  shopOwnerId,
  shopName,
  className = '',
  variant = 'default',
  size = 'default',
  showFollowerCount = true
}: FollowShopButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    new_items: true,
    sales: false,
    updates: true
  });

  useEffect(() => {
    fetchFollowStatus();
    fetchFollowerCount();
  }, [shopOwnerId, user]);

  const fetchFollowStatus = async () => {
    if (!user || !shopOwnerId) return;

    try {
      const { data, error } = await supabase
        .from('shop_follows')
        .select('notification_preferences')
        .eq('follower_id', user.id)
        .eq('shop_owner_id', shopOwnerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return;
      }

      setIsFollowing(!!data);
      if (data?.notification_preferences) {
        setNotificationPrefs(data.notification_preferences as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  const fetchFollowerCount = async () => {
    if (!shopOwnerId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_shop_follow_count', { shop_owner_uuid: shopOwnerId });

      if (error) {
        console.error('Error fetching follower count:', error);
        return;
      }

      setFollowerCount(data || 0);
    } catch (error) {
      console.error('Error fetching follower count:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow shops and get updates on new items.",
        duration: 4000,
      });
      return;
    }

    if (user.id === shopOwnerId) {
      toast({
        title: "Can't follow yourself",
        description: "You can't follow your own shop.",
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
          .from('shop_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('shop_owner_id', shopOwnerId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Unfollowed shop",
          description: `You will no longer receive updates from ${shopName}.`,
          duration: 3000,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('shop_follows')
          .insert({
            follower_id: user.id,
            shop_owner_id: shopOwnerId,
            notification_preferences: notificationPrefs
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        
        toast({
          title: "Following shop",
          description: `You'll get notified when ${shopName} adds new items.`,
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Error updating follow status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async (newPrefs: NotificationPreferences) => {
    if (!user || !isFollowing) return;

    try {
      const { error } = await supabase
        .from('shop_follows')
        .update({ notification_preferences: newPrefs })
        .eq('follower_id', user.id)
        .eq('shop_owner_id', shopOwnerId);

      if (error) throw error;

      setNotificationPrefs(newPrefs);
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
        duration: 2000,
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    updateNotificationPreferences(newPrefs);
  };

  if (user?.id === shopOwnerId) {
    return null; // Don't show follow button for own shop
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Button
          onClick={handleFollow}
          disabled={loading}
          variant={isFollowing ? 'outline' : variant}
          size={size}
          className={`gap-2 ${isFollowing ? 'border-primary text-primary' : ''}`}
        >
          <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
          {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
        </Button>

        {/* Notification Settings */}
        {isFollowing && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="p-2"
                aria-label="Notification settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm">Notification Preferences</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose what updates you'd like to receive from {shopName}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">New Items</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when new products are added
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.new_items}
                      onCheckedChange={(checked) => handleNotificationChange('new_items', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Sales & Promotions</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified about sales and special offers
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.sales}
                      onCheckedChange={(checked) => handleNotificationChange('sales', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Shop Updates</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified about shop announcements
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.updates}
                      onCheckedChange={(checked) => handleNotificationChange('updates', checked)}
                    />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <Bell className="h-3 w-3 inline mr-1" />
                  You can unsubscribe at any time
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Follower Count */}
      {showFollowerCount && followerCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
        </Badge>
      )}
    </div>
  );
};
