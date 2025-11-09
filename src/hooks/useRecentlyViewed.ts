import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const MAX_RECENTLY_VIEWED = 10;

export const useRecentlyViewed = () => {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Load recently viewed from localStorage
  useEffect(() => {
    const loadRecentlyViewed = () => {
      const storageKey = user ? `recently_viewed_${user.id}` : 'recently_viewed_anonymous';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentlyViewed(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Error parsing recently viewed:', error);
          setRecentlyViewed([]);
        }
      }
    };

    loadRecentlyViewed();
  }, [user]);

  const addToRecentlyViewed = (productId: string) => {
    const storageKey = user ? `recently_viewed_${user.id}` : 'recently_viewed_anonymous';

    // Remove if already exists (to move it to front)
    const filtered = recentlyViewed.filter(id => id !== productId);

    // Add to beginning and limit to MAX_RECENTLY_VIEWED
    const updated = [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);

    setRecentlyViewed(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const clearRecentlyViewed = () => {
    const storageKey = user ? `recently_viewed_${user.id}` : 'recently_viewed_anonymous';
    setRecentlyViewed([]);
    localStorage.removeItem(storageKey);
  };

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    hasRecentlyViewed: recentlyViewed.length > 0,
  };
};
