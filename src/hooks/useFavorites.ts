import { useState, useEffect, useCallback } from 'react';
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

  // Load favorites from database for authenticated users
  // or from localStorage for anonymous users
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('listing_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.log('User favorites table not available yet');
            // Fall back to localStorage
            const stored = localStorage.getItem(`favorites_${user.id}`);
            if (stored) {
              setFavorites(JSON.parse(stored));
            }
          } else {
            const favoriteIds = (data || []).map(f => f.listing_id);
            setFavorites(favoriteIds);
            // Keep localStorage in sync for offline access
            localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favoriteIds));
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
          // Fall back to localStorage
          const stored = localStorage.getItem(`favorites_${user.id}`);
          if (stored) {
            setFavorites(JSON.parse(stored));
          }
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

  // Migrate localStorage favorites to database when user logs in
  useEffect(() => {
    const migrateLocalFavorites = async () => {
      if (!user) return;

      const anonymousFavorites = localStorage.getItem('favorites_anonymous');
      if (anonymousFavorites) {
        const favoriteIds: string[] = JSON.parse(anonymousFavorites);
        if (favoriteIds.length > 0) {
          try {
            // Insert favorites that don't already exist
            for (const listingId of favoriteIds) {
              await supabase
                .from('user_favorites')
                .upsert(
                  { user_id: user.id, listing_id: listingId },
                  { onConflict: 'user_id,listing_id' }
                );
            }
            // Clear anonymous storage after migration
            localStorage.removeItem('favorites_anonymous');
          } catch (error) {
            console.log('Could not migrate favorites to database');
          }
        }
      }
    };

    migrateLocalFavorites();
  }, [user]);

  const toggleFavorite = useCallback(async (listingId: string) => {
    const isFavorited = favorites.includes(listingId);

    if (user) {
      // Optimistic update
      const newFavorites = isFavorited
        ? favorites.filter(id => id !== listingId)
        : [...favorites, listingId];
      setFavorites(newFavorites);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));

      try {
        if (isFavorited) {
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('listing_id', listingId);

          if (error) throw error;
          toast.success('Removed from favorites');
        } else {
          const { error } = await supabase
            .from('user_favorites')
            .insert({ user_id: user.id, listing_id: listingId });

          if (error) throw error;
          toast.success('Added to favorites');
        }
      } catch (error) {
        console.error('Error updating favorite:', error);
        // Revert optimistic update on error
        setFavorites(favorites);
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
        toast.error('Failed to update favorites');
      }
    } else {
      // Anonymous user - localStorage only
      const newFavorites = isFavorited
        ? favorites.filter(id => id !== listingId)
        : [...favorites, listingId];
      localStorage.setItem('favorites_anonymous', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
    }
  }, [user, favorites]);

  const isFavorite = useCallback((listingId: string): boolean => {
    return favorites.includes(listingId);
  }, [favorites]);

  const clearFavorites = useCallback(async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

        setFavorites([]);
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify([]));
        toast.info('All favorites cleared');
      } catch (error) {
        console.error('Error clearing favorites:', error);
        toast.error('Failed to clear favorites');
      }
    } else {
      localStorage.setItem('favorites_anonymous', JSON.stringify([]));
      setFavorites([]);
      toast.info('All favorites cleared');
    }
  }, [user]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoriteCount: favorites.length,
  };
};
