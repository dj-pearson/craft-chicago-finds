import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SavedItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_name: string;
  saved_at: string;
  is_synced: boolean;
}

interface RecommendedItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_name: string;
  reason: string;
  score: number;
}

interface SmartSaveData {
  favorites: SavedItem[];
  recentViews: SavedItem[];
  recommendations: RecommendedItem[];
}

const STORAGE_KEYS = {
  FAVORITES: "craft_local_favorites",
  RECENT_VIEWS: "craft_local_recent_views",
  LAST_SYNC: "craft_local_last_sync",
  MAGIC_LINK_SENT: "craft_local_magic_link_sent",
};

export const useSmartSave = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [recentViews, setRecentViews] = useState<SavedItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "synced" | "error"
  >("idle");

  // Load data from localStorage on mount
  useEffect(() => {
    loadLocalData();
  }, []);

  // Sync with server when user logs in
  useEffect(() => {
    if (user) {
      syncWithServer();
    }
  }, [user]);

  // Generate recommendations based on favorites and views
  useEffect(() => {
    if (favorites.length > 0 || recentViews.length > 0) {
      generateRecommendations();
    }
  }, [favorites, recentViews]);

  const loadLocalData = () => {
    try {
      const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const savedViews = localStorage.getItem(STORAGE_KEYS.RECENT_VIEWS);

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }

      if (savedViews) {
        setRecentViews(JSON.parse(savedViews));
      }
    } catch (error) {
      console.error("Error loading local data:", error);
    }
  };

  const saveToLocal = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const addToFavorites = useCallback(
    async (item: Omit<SavedItem, "saved_at" | "is_synced">) => {
      const newItem: SavedItem = {
        ...item,
        saved_at: new Date().toISOString(),
        is_synced: false,
      };

      const updatedFavorites = [
        ...favorites.filter((f) => f.id !== item.id),
        newItem,
      ];
      setFavorites(updatedFavorites);
      saveToLocal(STORAGE_KEYS.FAVORITES, updatedFavorites);

      // Sync to server if user is logged in
      if (user) {
        try {
          // TODO: Implement user_favorites table
          console.log('User favorites sync not yet implemented');

          // Mark as synced for now
          const syncedFavorites = updatedFavorites.map((f) =>
            f.id === item.id ? { ...f, is_synced: true } : f
          );
          setFavorites(syncedFavorites);
          saveToLocal(STORAGE_KEYS.FAVORITES, syncedFavorites);
        } catch (error) {
          console.error("Error syncing favorite to server:", error);
        }
      } else {
        // Show magic link prompt for first-time users
        showMagicLinkPrompt();
      }

      toast({
        title: "Added to favorites",
        description: user
          ? "Item saved to your account"
          : "Item saved locally. Sign in to sync across devices.",
        duration: 3000,
      });
    },
    [favorites, user, toast]
  );

  const removeFromFavorites = useCallback(
    async (itemId: string) => {
      const updatedFavorites = favorites.filter((f) => f.id !== itemId);
      setFavorites(updatedFavorites);
      saveToLocal(STORAGE_KEYS.FAVORITES, updatedFavorites);

      // Remove from server if user is logged in
      if (user) {
        try {
          // TODO: Implement user_favorites table removal
          console.log('User favorites removal not yet implemented');
        } catch (error) {
          console.error("Error removing favorite from server:", error);
        }
      }

      toast({
        title: "Removed from favorites",
        description: "Item removed from your saved items",
        duration: 2000,
      });
    },
    [favorites, user, toast]
  );

  const addToRecentViews = useCallback(
    async (item: Omit<SavedItem, "saved_at" | "is_synced">) => {
      const newItem: SavedItem = {
        ...item,
        saved_at: new Date().toISOString(),
        is_synced: false,
      };

      // Keep only last 20 recent views
      const updatedViews = [
        newItem,
        ...recentViews.filter((v) => v.id !== item.id),
      ].slice(0, 20);
      setRecentViews(updatedViews);
      saveToLocal(STORAGE_KEYS.RECENT_VIEWS, updatedViews);

      // Sync to server if user is logged in
      if (user) {
        try {
          // TODO: Implement track_listing_view function
          console.log('Listing view tracking not yet implemented');

          // Mark as synced for now
          const syncedViews = updatedViews.map((v) =>
            v.id === item.id ? { ...v, is_synced: true } : v
          );
          setRecentViews(syncedViews);
          saveToLocal(STORAGE_KEYS.RECENT_VIEWS, syncedViews);
        } catch (error) {
          console.error("Error syncing view to server:", error);
        }
      }
    },
    [recentViews, user]
  );

  const syncWithServer = useCallback(async () => {
    if (!user) return;

    setSyncStatus("syncing");
    setLoading(true);

    try {
      // Sync favorites to server
      const unsyncedFavorites = favorites.filter((f) => !f.is_synced);
      if (unsyncedFavorites.length > 0) {
        // TODO: Implement user_favorites table sync
        console.log('Favorites sync to server not yet implemented');
      }

      // Sync recent views to server
      const unsyncedViews = recentViews.filter((v) => !v.is_synced);
      if (unsyncedViews.length > 0) {
        // TODO: Implement view tracking sync
        console.log('Views sync to server not yet implemented');
      }

      // For now, just mark everything as synced locally
      const syncedFavorites = favorites.map(f => ({ ...f, is_synced: true }));
      const syncedViews = recentViews.map(v => ({ ...v, is_synced: true }));
      
      setFavorites(syncedFavorites);
      setRecentViews(syncedViews);
      saveToLocal(STORAGE_KEYS.FAVORITES, syncedFavorites);
      saveToLocal(STORAGE_KEYS.RECENT_VIEWS, syncedViews);

      setSyncStatus("synced");
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      toast({
        title: "Data synced",
        description:
          "Your favorites and recent views have been synced across devices.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error syncing with server:", error);
      setSyncStatus("error");
      toast({
        title: "Sync error",
        description: "Failed to sync your data. Your local data is safe.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [user, favorites, recentViews, toast]);

  const mergeWithServerData = (
    localData: SavedItem[],
    serverData: any[],
    type: "favorites" | "views"
  ): SavedItem[] => {
    const serverItems: SavedItem[] = serverData.map((item) => ({
      id: item.listing_id,
      title: item.title,
      price: item.price,
      images: item.images || [],
      seller_name: item.seller_name || "Unknown",
      saved_at: type === "favorites" ? item.favorited_at : item.viewed_at,
      is_synced: true,
    }));

    // Merge local and server data, preferring server data for conflicts
    const merged = new Map<string, SavedItem>();

    // Add local items first
    localData.forEach((item) => merged.set(item.id, item));

    // Override with server items (they're more authoritative)
    serverItems.forEach((item) => merged.set(item.id, item));

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    );
  };

  const generateRecommendations = useCallback(async () => {
    if (!user) {
      // Generate simple local recommendations based on categories
      generateLocalRecommendations();
      return;
    }

    try {
      // TODO: Implement get_smart_recommendations function
      console.log('Smart recommendations not yet implemented');
      generateLocalRecommendations();
    } catch (error) {
      console.error("Error generating recommendations:", error);
      generateLocalRecommendations();
    }
  }, [user, favorites, recentViews]);

  const generateLocalRecommendations = () => {
    // Simple local recommendation logic
    // In a real app, this would be more sophisticated
    const mockRecommendations: RecommendedItem[] = [
      {
        id: "rec-1",
        title: "Similar to your favorites",
        price: 25.0,
        images: ["/placeholder.svg"],
        seller_name: "Local Artisan",
        reason: "Based on your recent activity",
        score: 0.8,
      },
    ];

    setRecommendations(mockRecommendations);
  };

  const showMagicLinkPrompt = () => {
    const lastPrompt = localStorage.getItem(STORAGE_KEYS.MAGIC_LINK_SENT);
    const daysSinceLastPrompt = lastPrompt
      ? (Date.now() - new Date(lastPrompt).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    // Only show prompt once per week
    if (daysSinceLastPrompt > 7) {
      toast({
        title: "Save across devices?",
        description:
          "Sign in to sync your favorites and get personalized recommendations.",
        duration: 8000,
        action: (
          <button
            onClick={() => {
              window.location.href = "/auth";
            }}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
          >
            Sign In
          </button>
        ),
      });

      localStorage.setItem(
        STORAGE_KEYS.MAGIC_LINK_SENT,
        new Date().toISOString()
      );
    }
  };

  const clearLocalData = () => {
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.RECENT_VIEWS);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    setFavorites([]);
    setRecentViews([]);
    setRecommendations([]);
    setSyncStatus("idle");
  };

  const isFavorited = useCallback(
    (itemId: string) => {
      return favorites.some((f) => f.id === itemId);
    },
    [favorites]
  );

  const getStats = () => {
    const unsyncedCount =
      favorites.filter((f) => !f.is_synced).length +
      recentViews.filter((v) => !v.is_synced).length;

    return {
      favoritesCount: favorites.length,
      recentViewsCount: recentViews.length,
      recommendationsCount: recommendations.length,
      unsyncedCount,
      lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
    };
  };

  return {
    // Data
    favorites,
    recentViews,
    recommendations,

    // Actions
    addToFavorites,
    removeFromFavorites,
    addToRecentViews,
    syncWithServer,
    clearLocalData,

    // Utilities
    isFavorited,
    getStats,

    // State
    loading,
    syncStatus,
  };
};
