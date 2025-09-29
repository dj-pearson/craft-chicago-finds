import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvancedProductFilters } from "@/components/browse/AdvancedProductFilters";
import { ProductGrid } from "@/components/browse/ProductGrid";
import { SearchBar } from "@/components/browse/SearchBar";
import { SearchResults } from "@/components/browse/SearchResults";
import { ReadyTodayFilters } from "@/components/browse/ReadyTodayFilters";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
}

export interface Category {
  id: string;
  name: string;
  slug: string;
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
}

const Browse = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentCity, loading: cityLoading, isValidCity } = useCityContext();
  const { trackSearch } = useSearchAnalytics();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const fulfillment = searchParams.get('fulfillment');
    const sortBy = searchParams.get('sortBy');

    setFilters({
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      fulfillment: fulfillment as any || undefined,
      sortBy: sortBy as any || 'newest',
    });
  }, [searchParams]);

  // Fetch categories and listings
  useEffect(() => {
    if (currentCity && isValidCity) {
      fetchCategories();
      fetchListings();
    }
  }, [currentCity, isValidCity, filters, searchQuery]);

  const fetchCategories = async () => {
    if (!currentCity) return;

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchListings = async () => {
    if (!currentCity) return;

    setLoading(true);
    try {
      let query = supabase
        .from("listings")
        .select(`
          *,
          categories(id, name, slug)
        `)
        .eq("city_id", currentCity.id)
        .eq("status", "active");

      // Apply filters
      if (filters.category) {
        query = query.eq("categories.slug", filters.category);
      }

      if (filters.minPrice) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters.fulfillment === 'pickup') {
        query = query.eq("local_pickup_available", true);
      } else if (filters.fulfillment === 'shipping') {
        query = query.eq("shipping_available", true);
      }

      // Apply ready today filters
      if (filters.readyToday) {
        query = query.eq("ready_today", true);
      }
      if (filters.shipsToday) {
        query = query.eq("ships_today", true);
      }
      if (filters.pickupToday) {
        query = query.eq("pickup_today", true);
      }

      // Apply search with better relevance
      if (searchQuery) {
        // Search across multiple fields with weighted relevance
        query = query.or(
          `title.ilike.%${searchQuery}%,` +
          `description.ilike.%${searchQuery}%,` +
          `tags.cs.{${searchQuery}}`
        );
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
        console.error("Error fetching listings:", error);
        return;
      }

      const results = data || [];
      setListings(results);

      // Track search analytics
      if (searchQuery && results.length >= 0) {
        trackSearch({
          query: searchQuery,
          results_count: results.length,
          filters_used: filters,
          city_id: currentCity.id
        });
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || cityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show invalid city page
  if (!isValidCity || !currentCity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">City Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We don't have a marketplace for this city yet.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Don't render if user not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/${currentCity.slug}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {currentCity.name}
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Browse {currentCity.name} Marketplace
          </h1>
          <p className="text-muted-foreground">
            Discover unique handmade goods from local artisans
          </p>
        </div>

        {/* Search */}
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={fetchListings}
          cityId={currentCity.id}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ReadyTodayFilters
              filters={{
                readyToday: filters.readyToday,
                shipsToday: filters.shipsToday,
                pickupToday: filters.pickupToday
              }}
              onFiltersChange={(readyFilters) => setFilters({
                ...filters,
                ...readyFilters
              })}
            />
            <AdvancedProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={['handmade', 'organic', 'custom', 'vintage', 'eco-friendly']}
            />
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <SearchResults
              listings={listings}
              categories={categories}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalResults={listings.length}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;