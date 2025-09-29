import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

  // Sync with server when user logs in (stub for now)
  useEffect(() => {
    if (user && state.hasPendingSync) {
      // TODO: Implement server sync when user_favorites and user_recent_views tables exist
      console.log('Smart save sync not yet implemented');
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
      synced: false, // Mark as not synced since we don't have server integration yet
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
        hasPendingSync: true,
      };

      saveToStorage({ favorites: newFavorites });
      return newState;
    });

    toast({
      title: "Added to favorites",
      description: "Saved locally. Server sync coming soon!",
      duration: 3000,
    });
  }, [toast, saveToStorage]);

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

    toast({
      title: "Removed from favorites",
      duration: 2000,
    });
  }, [toast, saveToStorage]);

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
      synced: false,
    };

    setState(prev => {
      // Remove existing view of the same listing and add to top
      const filteredViews = prev.recentViews.filter(v => v.listing_id !== listingId);
      const newRecentViews = [newView, ...filteredViews].slice(0, MAX_RECENT_VIEWS);

      saveToStorage({ recentViews: newRecentViews });

      return {
        ...prev,
        recentViews: newRecentViews,
        hasPendingSync: true,
      };
    });
  }, [saveToStorage]);

  // Clear recent views
  const clearRecentViews = useCallback(() => {
    setState(prev => ({
      ...prev,
      recentViews: [],
    }));
    
    localStorage.removeItem(STORAGE_KEYS.recentViews);
  }, []);

  // Sync with server (stub)
  const syncWithServer = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // TODO: Implement server sync when user_favorites and user_recent_views tables exist
      console.log('Server sync not yet implemented');
      
      toast({
        title: "Feature coming soon",
        description: "Server sync will be available soon!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error syncing with server:', error);
      toast({
        title: "Sync failed",
        description: "Unable to sync your data. Please try again later.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, toast]);

  // Send magic link for syncing (stub)
  const sendSyncMagicLink = useCallback(async (email: string) => {
    try {
      // TODO: Implement magic link when auth system supports it
      console.log('Magic link not yet implemented:', email);
      
      toast({
        title: "Feature coming soon",
        description: "Magic link sync will be available soon!",
        duration: 3000,
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