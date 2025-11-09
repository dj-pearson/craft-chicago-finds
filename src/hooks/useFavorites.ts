import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Favorite {
  listing_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage for non-authenticated users
  // or from Supabase for authenticated users
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        // Load from Supabase (future implementation)
        // For now, use localStorage
        const stored = localStorage.getItem(`favorites_${user.id}`);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem('favorites_anonymous');
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      }
      setLoading(false);
    };

    loadFavorites();
  }, [user]);

  const saveFavorites = (newFavorites: string[]) => {
    const storageKey = user ? `favorites_${user.id}` : 'favorites_anonymous';
    localStorage.setItem(storageKey, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  };

  const toggleFavorite = (listingId: string) => {
    const isFavorited = favorites.includes(listingId);

    if (isFavorited) {
      const newFavorites = favorites.filter(id => id !== listingId);
      saveFavorites(newFavorites);
      toast.success('Removed from favorites');
    } else {
      const newFavorites = [...favorites, listingId];
      saveFavorites(newFavorites);
      toast.success('Added to favorites');
    }
  };

  const isFavorite = (listingId: string): boolean => {
    return favorites.includes(listingId);
  };

  const clearFavorites = () => {
    saveFavorites([]);
    toast.info('All favorites cleared');
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoriteCount: favorites.length,
  };
};
