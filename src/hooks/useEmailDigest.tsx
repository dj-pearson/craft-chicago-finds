import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailDigestPreference {
  id: string;
  digest_type: 'shop_follows' | 'collections' | 'weekly_digest' | 'monthly_summary';
  frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  last_sent_at: string | null;
  is_active: boolean;
}

interface DigestContent {
  new_items: Array<{
    id: string;
    title: string;
    price: number;
    images: string[];
    seller_name: string;
    shop_name: string;
  }>;
  collection_updates: Array<{
    id: string;
    title: string;
    new_items_count: number;
    creator_name: string;
  }>;
  followed_shops: Array<{
    id: string;
    name: string;
    new_items_count: number;
  }>;
}

export const useEmailDigest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<EmailDigestPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [digestContent, setDigestContent] = useState<DigestContent | null>(null);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_digest_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(data || []);

      // Create default preferences if none exist
      if (!data || data.length === 0) {
        await createDefaultPreferences();
      }
    } catch (error: any) {
      console.error('Error fetching digest preferences:', error);
      toast({
        title: "Error loading preferences",
        description: error.message || "Failed to load email preferences.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createDefaultPreferences = async () => {
    if (!user) return;

    const defaultPrefs = [
      {
        user_id: user.id,
        digest_type: 'shop_follows' as const,
        frequency: 'weekly' as const,
        is_active: true,
      },
      {
        user_id: user.id,
        digest_type: 'collections' as const,
        frequency: 'weekly' as const,
        is_active: true,
      },
      {
        user_id: user.id,
        digest_type: 'weekly_digest' as const,
        frequency: 'weekly' as const,
        is_active: true,
      },
      {
        user_id: user.id,
        digest_type: 'monthly_summary' as const,
        frequency: 'monthly' as const,
        is_active: false,
      },
    ];

    try {
      const { error } = await supabase
        .from('email_digest_preferences')
        .insert(defaultPrefs);

      if (error) throw error;

      await fetchPreferences();
    } catch (error: any) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updatePreference = useCallback(async (
    digestType: EmailDigestPreference['digest_type'],
    updates: Partial<Pick<EmailDigestPreference, 'frequency' | 'is_active'>>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('email_digest_preferences')
        .upsert({
          user_id: user.id,
          digest_type: digestType,
          ...updates,
        });

      if (error) throw error;

      setPreferences(prev => 
        prev.map(pref => 
          pref.digest_type === digestType 
            ? { ...pref, ...updates }
            : pref
        )
      );

      toast({
        title: "Preferences updated",
        description: "Your email digest preferences have been saved.",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast({
        title: "Error updating preferences",
        description: error.message || "Failed to update email preferences.",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [user, toast]);

  const generateDigestContent = useCallback(async (
    digestType: EmailDigestPreference['digest_type']
  ): Promise<DigestContent | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      
      let newItems: DigestContent['new_items'] = [];
      let collectionUpdates: DigestContent['collection_updates'] = [];
      let followedShops: DigestContent['followed_shops'] = [];

      // Get new items from followed shops
      if (digestType === 'shop_follows' || digestType === 'weekly_digest') {
        const { data: shopFollows } = await supabase
          .from('shop_follows')
          .select(`
            shop_owner_id,
            profiles!shop_follows_shop_owner_id_fkey(display_name)
          `)
          .eq('follower_id', user.id);

        if (shopFollows && shopFollows.length > 0) {
          const shopOwnerIds = shopFollows.map(f => f.shop_owner_id);
          
          // Get new listings from followed shops (last 7 days)
          const { data: listings } = await supabase
            .from('listings')
            .select(`
              id,
              title,
              price,
              images,
              seller_id,
              profiles!listings_seller_id_fkey(display_name)
            `)
            .in('seller_id', shopOwnerIds)
            .eq('status', 'active')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          newItems = (listings || []).map(listing => ({
            id: listing.id,
            title: listing.title,
            price: listing.price,
            images: listing.images || [],
            seller_name: (listing as any).profiles?.display_name || 'Unknown',
            shop_name: (listing as any).profiles?.display_name || 'Unknown Shop',
          }));

          // Group by shop for followed shops summary
          const shopCounts = new Map<string, { name: string; count: number; id: string }>();
          listings?.forEach(listing => {
            const shopId = listing.seller_id;
            const shopName = (listing as any).profiles?.display_name || 'Unknown Shop';
            const current = shopCounts.get(shopId) || { name: shopName, count: 0, id: shopId };
            shopCounts.set(shopId, { ...current, count: current.count + 1 });
          });

          followedShops = Array.from(shopCounts.values()).map(shop => ({
            id: shop.id,
            name: shop.name,
            new_items_count: shop.count,
          }));
        }
      }

      // Get collection updates
      if (digestType === 'collections' || digestType === 'weekly_digest') {
        const { data: collectionFollows } = await supabase
          .from('collection_follows')
          .select(`
            collection_id,
            collections!collection_follows_collection_id_fkey(
              id,
              title,
              creator_id,
              updated_at,
              profiles!collections_creator_id_fkey(display_name)
            )
          `)
          .eq('follower_id', user.id);

        if (collectionFollows && collectionFollows.length > 0) {
          // Get collections updated in the last 7 days
          const recentlyUpdated = collectionFollows.filter(follow => {
            const collection = (follow as any).collections;
            const updatedAt = new Date(collection.updated_at);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return updatedAt > weekAgo;
          });

          for (const follow of recentlyUpdated) {
            const collection = (follow as any).collections;
            
            // Get new items added to this collection in the last 7 days
            const { data: newCollectionItems } = await supabase
              .from('collection_items')
              .select('id')
              .eq('collection_id', collection.id)
              .gte('added_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

            if (newCollectionItems && newCollectionItems.length > 0) {
              collectionUpdates.push({
                id: collection.id,
                title: collection.title,
                new_items_count: newCollectionItems.length,
                creator_name: collection.profiles?.display_name || 'Unknown Creator',
              });
            }
          }
        }
      }

      const content: DigestContent = {
        new_items: newItems,
        collection_updates: collectionUpdates,
        followed_shops: followedShops,
      };

      setDigestContent(content);
      return content;

    } catch (error: any) {
      console.error('Error generating digest content:', error);
      toast({
        title: "Error generating digest",
        description: error.message || "Failed to generate digest content.",
        variant: "destructive",
        duration: 4000,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const sendTestDigest = useCallback(async (
    digestType: EmailDigestPreference['digest_type']
  ) => {
    if (!user) return;

    try {
      const content = await generateDigestContent(digestType);
      if (!content) return;

      // In a real implementation, this would call a Supabase Edge Function
      // For now, we'll just show a preview
      toast({
        title: "Test digest generated",
        description: `Found ${content.new_items.length} new items and ${content.collection_updates.length} collection updates.`,
        duration: 4000,
      });

      return content;
    } catch (error: any) {
      console.error('Error sending test digest:', error);
      toast({
        title: "Error sending test digest",
        description: error.message || "Failed to send test digest.",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [generateDigestContent, user, toast]);

  const unsubscribeFromAll = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('email_digest_preferences')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(prev => 
        prev.map(pref => ({ ...pref, is_active: false }))
      );

      toast({
        title: "Unsubscribed from all digests",
        description: "You will no longer receive email digests. You can re-enable them anytime.",
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error unsubscribing",
        description: error.message || "Failed to unsubscribe from digests.",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [user, toast]);

  const getPreference = useCallback((digestType: EmailDigestPreference['digest_type']) => {
    return preferences.find(pref => pref.digest_type === digestType);
  }, [preferences]);

  return {
    preferences,
    loading,
    digestContent,
    fetchPreferences,
    updatePreference,
    generateDigestContent,
    sendTestDigest,
    unsubscribeFromAll,
    getPreference,
  };
};
