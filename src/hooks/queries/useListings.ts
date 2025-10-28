import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';
import {
  parseNaturalLanguageSearch,
  buildEnhancedSearchQuery,
  calculateSearchRelevance,
} from '@/lib/search-utils';

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  images: string[];
  seller_id: string;
  category_id: string | null;
  city_id: string | null;
  status: string;
  featured: boolean;
  local_pickup_available: boolean;
  shipping_available: boolean;
  inventory_count: number | null;
  view_count: number | null;
  created_at: string;
  pickup_location?: string | null;
  ready_today?: boolean;
  ships_today?: boolean;
  pickup_today?: boolean;
  categories?: {
    id: string;
    name: string;
    slug: string;
  };
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio?: string | null;
    seller_verified?: boolean;
  };
  searchScore?: number;
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fulfillment?: 'pickup' | 'shipping' | 'both';
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular';
  readyToday?: boolean;
  shipsToday?: boolean;
  pickupToday?: boolean;
  materials?: string[];
  styles?: string[];
  attributes?: string[];
}

export const useListings = (
  cityId: string | undefined,
  filters: FilterOptions = {},
  searchQuery: string = ''
) => {
  return useQuery({
    queryKey: queryKeys.listings(cityId || '', filters, searchQuery),
    queryFn: async (): Promise<Listing[]> => {
      if (!cityId) return [];

      let query = supabase
        .from('listings')
        .select(
          `
          *,
          categories(id, name, slug)
        `
        )
        .eq('city_id', cityId)
        .eq('status', 'active');

      // Apply filters
      if (filters.category) {
        query = query.eq('categories.slug', filters.category);
      }

      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.fulfillment === 'pickup') {
        query = query.eq('local_pickup_available', true);
      } else if (filters.fulfillment === 'shipping') {
        query = query.eq('shipping_available', true);
      }

      // Apply ready today filters
      if (filters.readyToday) {
        query = query.eq('ready_today', true);
      }
      if (filters.shipsToday) {
        query = query.eq('ships_today', true);
      }
      if (filters.pickupToday) {
        query = query.eq('pickup_today', true);
      }

      // Apply enhanced natural language search
      if (searchQuery) {
        const parsedSearch = parseNaturalLanguageSearch(searchQuery);

        // Apply price filters from natural language
        if (parsedSearch.priceRange) {
          if (parsedSearch.priceRange.min) {
            query = query.gte('price', parsedSearch.priceRange.min);
          }
          if (parsedSearch.priceRange.max) {
            query = query.lte('price', parsedSearch.priceRange.max);
          }
        }

        // Build enhanced search query with synonyms and typo corrections
        query = buildEnhancedSearchQuery(query, searchQuery, parsedSearch);
      }

      // Apply material filters
      if (filters.materials && filters.materials.length > 0) {
        const materialConditions = filters.materials
          .map((material) => `tags.cs.{${material}}`)
          .join(',');
        query = query.or(materialConditions);
      }

      // Apply style filters
      if (filters.styles && filters.styles.length > 0) {
        const styleConditions = filters.styles
          .map((style) => `tags.cs.{${style}}`)
          .join(',');
        query = query.or(styleConditions);
      }

      // Apply attribute filters
      if (filters.attributes && filters.attributes.length > 0) {
        const attributeConditions = filters.attributes
          .map((attribute) => `tags.cs.{${attribute}}`)
          .join(',');
        query = query.or(attributeConditions);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        throw error;
      }

      let results = data || [];

      // Apply search relevance sorting if there's a search query
      if (searchQuery && results.length > 0) {
        const parsedSearch = parseNaturalLanguageSearch(searchQuery);
        results = results
          .map((listing) => ({
            ...listing,
            searchScore: calculateSearchRelevance(
              listing,
              searchQuery,
              parsedSearch
            ),
          }))
          .sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
      }

      return results;
    },
    enabled: !!cityId,
  });
};
