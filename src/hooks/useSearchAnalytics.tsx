import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchAnalyticsData {
  query: string;
  results_count: number;
  filters_used?: Record<string, any>;
  city_id?: string;
  user_id?: string;
}

export const useSearchAnalytics = () => {
  const { user } = useAuth();

  const trackSearch = async (data: SearchAnalyticsData) => {
    try {
      // Track search in database for analytics
      const { error } = await supabase
        .from('search_analytics')
        .insert([{
          ...data,
          user_id: user?.id || null,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error tracking search:', error);
      }
    } catch (error) {
      console.error('Error tracking search analytics:', error);
    }
  };

  const trackProductView = async (listingId: string, searchQuery?: string) => {
    try {
      const { error } = await supabase
        .from('listing_analytics')
        .insert([{
          listing_id: listingId,
          event_type: 'view',
          user_id: user?.id || null,
          referrer: searchQuery ? `search:${searchQuery}` : null,
          user_agent: navigator.userAgent
        }]);

      if (error) {
        console.error('Error tracking product view:', error);
      }
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  return {
    trackSearch,
    trackProductView
  };
};