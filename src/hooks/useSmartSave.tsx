import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SavedItem {
  id: string;
  type: 'favorite' | 'recent_view';
  listing_id: string;
  listing_data?: {
    title: string;
    price: number;
    images?: string[];
    seller_name?: string;
  };
  timestamp: number;
  synced?: boolean;
}

interface SmartSaveState {
  favorites: SavedItem[];
  recentViews: SavedItem[];
  isLoading: boolean;
  hasPendingSync: boolean;
}

const STORAGE_KEYS = {
  favorites: 'craft_local_favorites',
  recentViews: 'craft_local_recent_views',
  syncToken: 'craft_local_sync_token',
} as const;

const MAX_RECENT_VIEWS = 50;
const MAX_FAVORITES = 200;

export const useSmartSave = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<SmartSaveState>({
    favorites: [],
    recentViews: [],
    isLoading: false,
    hasPendingSync: false,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Sync with server when user logs in
  useEffect(() => {
    if (user && state.hasPendingSync) {
      syncWithServer();
    }
  }, [user, state.hasPendingSync]);

  const loadFromStorage = useCallback(() => {
    try {
      const favorites = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.favorites) || '[]'
      ) as SavedItem[];
      
      const recentViews = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.recentViews) || '[]'
      ) as SavedItem[];

      const hasPendingSync = favorites.some(f => !f.synced) || recentViews.some(r => !r.synced);

      setState(prev => ({
        ...prev,
        favorites,
        recentViews,
        hasPendingSync,
      }));
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }, []);

  const saveToStorage = useCallback((newState: Partial<SmartSaveState>) => {
    if (newState.favorites) {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(newState.favorites));
    }
    if (newState.recentViews) {
      localStorage.setItem(STORAGE_KEYS.recentViews, JSON.stringify(newState.recentViews));
    }
  }, []);

  // Add to favorites
  const addFavorite = useCallback(async (
    listingId: string, 
    listingData?: SavedItem['listing_data']
  ) => {
    const newFavorite: SavedItem = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'favorite',
      listing_id: listingId,
      listing_data: listingData,
      timestamp: Date.now(),
      synced: !!user, // Mark as synced if user is logged in
    };

    setState(prev => {
      const existingIndex = prev.favorites.findIndex(f => f.listing_id === listingId);
      let newFavorites;
      
      if (existingIndex >= 0) {
        // Update existing favorite
        newFavorites = [...prev.favorites];
        newFavorites[existingIndex] = { ...newFavorites[existingIndex], ...newFavorite };
      } else {
        // Add new favorite (limit to MAX_FAVORITES)
        newFavorites = [newFavorite, ...prev.favorites].slice(0, MAX_FAVORITES);
      }

      const newState = {
        ...prev,
        favorites: newFavorites,
        hasPendingSync: !user || prev.hasPendingSync,
      };

      saveToStorage({ favorites: newFavorites });
      return newState;
    });

    // Sync immediately if user is logged in
    if (user) {
      try {
        await supabase
          .from('user_favorites')
          .upsert({
            user_id: user.id,
            listing_id: listingId,
            created_at: new Date().toISOString(),
          });
        
        // Mark as synced
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.map(f => 
            f.listing_id === listingId ? { ...f, synced: true } : f
          ),
        }));
      } catch (error) {
        console.error('Error syncing favorite:', error);
      }
    }

    toast({
      title: "Added to favorites",
      description: user 
        ? "Saved to your account" 
        : "Saved locally. Sign in to sync across devices.",
      duration: 3000,
    });
  }, [user, toast, saveToStorage]);

  // Remove from favorites
  const removeFavorite = useCallback(async (listingId: string) => {
    setState(prev => {
      const newFavorites = prev.favorites.filter(f => f.listing_id !== listingId);
      saveToStorage({ favorites: newFavorites });
      
      return {
        ...prev,
        favorites: newFavorites,
      };
    });

    // Remove from server if user is logged in
    if (user) {
      try {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);
      } catch (error) {
        console.error('Error removing favorite from server:', error);
      }
    }

    toast({
      title: "Removed from favorites",
      duration: 2000,
    });
  }, [user, toast, saveToStorage]);

  // Add to recent views
  const addRecentView = useCallback((
    listingId: string, 
    listingData?: SavedItem['listing_data']
  ) => {
    const newView: SavedItem = {
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'recent_view',
      listing_id: listingId,
      listing_data: listingData,
      timestamp: Date.now(),
      synced: !!user,
    };

    setState(prev => {
      // Remove existing view of the same listing and add to top
      const filteredViews = prev.recentViews.filter(v => v.listing_id !== listingId);
      const newRecentViews = [newView, ...filteredViews].slice(0, MAX_RECENT_VIEWS);

      saveToStorage({ recentViews: newRecentViews });

      return {
        ...prev,
        recentViews: newRecentViews,
        hasPendingSync: !user || prev.hasPendingSync,
      };
    });

    // Sync with server if user is logged in (fire and forget)
    if (user) {
      supabase
        .from('user_recent_views')
        .upsert({
          user_id: user.id,
          listing_id: listingId,
          viewed_at: new Date().toISOString(),
        })
        .then(() => {
          setState(prev => ({
            ...prev,
            recentViews: prev.recentViews.map(v => 
              v.listing_id === listingId ? { ...v, synced: true } : v
            ),
          }));
        })
        .catch(error => console.error('Error syncing recent view:', error));
    }
  }, [user, saveToStorage]);

  // Clear recent views
  const clearRecentViews = useCallback(() => {
    setState(prev => ({
      ...prev,
      recentViews: [],
    }));
    
    localStorage.removeItem(STORAGE_KEYS.recentViews);
    
    if (user) {
      supabase
        .from('user_recent_views')
        .delete()
        .eq('user_id', user.id)
        .catch(error => console.error('Error clearing recent views:', error));
    }
  }, [user]);

  // Sync with server
  const syncWithServer = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Sync favorites
      const unsyncedFavorites = state.favorites.filter(f => !f.synced);
      if (unsyncedFavorites.length > 0) {
        const favoritesToSync = unsyncedFavorites.map(f => ({
          user_id: user.id,
          listing_id: f.listing_id,
          created_at: new Date(f.timestamp).toISOString(),
        }));

        await supabase
          .from('user_favorites')
          .upsert(favoritesToSync);
      }

      // Sync recent views
      const unsyncedViews = state.recentViews.filter(v => !v.synced);
      if (unsyncedViews.length > 0) {
        const viewsToSync = unsyncedViews.map(v => ({
          user_id: user.id,
          listing_id: v.listing_id,
          viewed_at: new Date(v.timestamp).toISOString(),
        }));

        await supabase
          .from('user_recent_views')
          .upsert(viewsToSync);
      }

      // Load server data and merge
      const [serverFavorites, serverViews] = await Promise.all([
        supabase
          .from('user_favorites')
          .select('listing_id, created_at')
          .eq('user_id', user.id),
        supabase
          .from('user_recent_views')
          .select('listing_id, viewed_at')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(MAX_RECENT_VIEWS)
      ]);

      // Merge server data with local data
      const mergedFavorites = mergeSavedItems(
        state.favorites,
        serverFavorites.data?.map(f => ({
          id: `server_fav_${f.listing_id}`,
          type: 'favorite' as const,
          listing_id: f.listing_id,
          timestamp: new Date(f.created_at).getTime(),
          synced: true,
        })) || []
      );

      const mergedViews = mergeSavedItems(
        state.recentViews,
        serverViews.data?.map(v => ({
          id: `server_view_${v.listing_id}`,
          type: 'recent_view' as const,
          listing_id: v.listing_id,
          timestamp: new Date(v.viewed_at).getTime(),
          synced: true,
        })) || []
      );

      setState(prev => ({
        ...prev,
        favorites: mergedFavorites,
        recentViews: mergedViews,
        hasPendingSync: false,
        isLoading: false,
      }));

      saveToStorage({ 
        favorites: mergedFavorites, 
        recentViews: mergedViews 
      });

      toast({
        title: "Data synced",
        description: "Your favorites and recent views have been synced across devices",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error syncing with server:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Sync failed",
        description: "Unable to sync your data. Please try again later.",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [user, state.favorites, state.recentViews, toast, saveToStorage]);

  // Send magic link for syncing
  const sendSyncMagicLink = useCallback(async (email: string) => {
    try {
      // Generate a unique sync token
      const syncToken = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      localStorage.setItem(STORAGE_KEYS.syncToken, syncToken);

      // Send magic link (this would be implemented with your auth system)
      const response = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/sync?token=${syncToken}`,
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Magic link sent!",
        description: `Check your email at ${email} for a link to sync your data`,
        duration: 5000,
      });

    } catch (error) {
      console.error('Error sending magic link:', error);
      toast({
        title: "Failed to send magic link",
        description: "Please try again or contact support",
        variant: "destructive",
        duration: 4000,
      });
    }
  }, [toast]);

  // Helper function to merge saved items
  const mergeSavedItems = (local: SavedItem[], server: Partial<SavedItem>[]): SavedItem[] => {
    const merged = new Map<string, SavedItem>();
    
    // Add local items
    local.forEach(item => {
      merged.set(item.listing_id, item);
    });
    
    // Add or update with server items
    server.forEach(item => {
      if (item.listing_id) {
        const existing = merged.get(item.listing_id);
        if (!existing || (item.timestamp && item.timestamp > existing.timestamp)) {
          merged.set(item.listing_id, {
            ...existing,
            ...item,
          } as SavedItem);
        }
      }
    });
    
    return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp);
  };

  // Check if item is favorited
  const isFavorited = useCallback((listingId: string) => {
    return state.favorites.some(f => f.listing_id === listingId);
  }, [state.favorites]);

  // Check if item was recently viewed
  const wasRecentlyViewed = useCallback((listingId: string) => {
    return state.recentViews.some(v => v.listing_id === listingId);
  }, [state.recentViews]);

  return {
    // State
    favorites: state.favorites,
    recentViews: state.recentViews,
    isLoading: state.isLoading,
    hasPendingSync: state.hasPendingSync,
    
    // Actions
    addFavorite,
    removeFavorite,
    addRecentView,
    clearRecentViews,
    syncWithServer,
    sendSyncMagicLink,
    
    // Helpers
    isFavorited,
    wasRecentlyViewed,
    
    // Counts
    favoriteCount: state.favorites.length,
    recentViewCount: state.recentViews.length,
  };
};
