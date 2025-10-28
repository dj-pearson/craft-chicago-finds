import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with optimal settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on mount only if data is stale
      refetchOnMount: true,
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  // Listings
  listings: (cityId: string, filters?: any, searchQuery?: string) => 
    ['listings', cityId, filters, searchQuery].filter(Boolean),
  
  // Single listing
  listing: (listingId: string, cityId: string) => 
    ['listing', listingId, cityId],
  
  // Categories
  categories: (cityId: string) => 
    ['categories', cityId],
  
  // Related listings
  relatedListings: (listingId: string, categoryId: string, cityId: string) =>
    ['relatedListings', listingId, categoryId, cityId],
} as const;
