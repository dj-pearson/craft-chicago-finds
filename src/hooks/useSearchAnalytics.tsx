import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchAnalyticsData {
  query: string;
  results_count: number;
  filters_used?: Record<string, any>;
  city_id?: string;
}

// Debounce duplicate searches within this window (ms)
const SEARCH_DEBOUNCE_MS = 2000;

export const useSearchAnalytics = () => {
  const { user } = useAuth();
  const lastSearchRef = useRef<{ query: string; timestamp: number } | null>(null);

  const trackSearch = useCallback(async (data: SearchAnalyticsData) => {
    try {
      // Skip empty or very short queries
      if (!data.query || data.query.trim().length < 2) {
        return;
      }

      const normalizedQuery = data.query.trim().toLowerCase();
      const now = Date.now();

      // Debounce duplicate searches (same query within debounce window)
      if (
        lastSearchRef.current &&
        lastSearchRef.current.query === normalizedQuery &&
        now - lastSearchRef.current.timestamp < SEARCH_DEBOUNCE_MS
      ) {
        return;
      }

      lastSearchRef.current = { query: normalizedQuery, timestamp: now };

      // Insert search analytics into database
      const { error } = await supabase
        .from('search_analytics')
        .insert({
          query: data.query.trim(),
          results_count: data.results_count,
          filters_used: data.filters_used || null,
          city_id: data.city_id || null,
          user_id: user?.id || null,
        });

      if (error) {
        // Don't throw - search tracking shouldn't break the user experience
        console.error('Error tracking search:', error);
      }
    } catch (error) {
      // Silent fail - analytics shouldn't impact user experience
      console.error('Error tracking search analytics:', error);
    }
  }, [user?.id]);

  const trackProductView = useCallback(async (listingId: string, searchQuery?: string) => {
    try {
      const { error } = await supabase
        .from('listing_analytics')
        .insert({
          listing_id: listingId,
          event_type: 'view',
          user_id: user?.id || null,
          referrer: searchQuery ? `search:${searchQuery}` : null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });

      if (error) {
        console.error('Error tracking product view:', error);
      }
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }, [user?.id]);

  const trackZeroResults = useCallback(async (query: string, city_id?: string) => {
    try {
      if (!query || query.trim().length < 2) return;

      // Track as a search with 0 results - useful for identifying missing products
      const { error } = await supabase
        .from('search_analytics')
        .insert({
          query: query.trim(),
          results_count: 0,
          filters_used: { zero_results: true },
          city_id: city_id || null,
          user_id: user?.id || null,
        });

      if (error) {
        console.error('Error tracking zero results:', error);
      }
    } catch (error) {
      console.error('Error tracking zero results:', error);
    }
  }, [user?.id]);

  return {
    trackSearch,
    trackProductView,
    trackZeroResults,
  };
};