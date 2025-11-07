import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdvancedProductFilters } from "@/components/browse/AdvancedProductFilters";
import { ProductGrid } from "@/components/browse/ProductGrid";
import { SearchBar } from "@/components/browse/SearchBar";
import { SearchResults } from "@/components/browse/SearchResults";
import { ReadyTodayFilters } from "@/components/browse/ReadyTodayFilters";
import { VisualSearch } from "@/components/browse/VisualSearch";
import { SubtleSignupPrompt } from "@/components/auth/SubtleSignupPrompt";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { useListings, type Listing, type FilterOptions } from "@/hooks/queries/useListings";
import { useCategories, type Category } from "@/hooks/queries/useCategories";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

// Re-export types for other components
export type { Listing, Category, FilterOptions };


const Browse = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentCity, loading: cityLoading, isValidCity } = useCityContext();
  const { trackSearch } = useSearchAnalytics();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [visualSearchResults, setVisualSearchResults] = useState<Listing[] | null>(null);

  // Fetch data using React Query
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(currentCity?.id);
  const { data: fetchedListings = [], isLoading: listingsLoading } = useListings(
    currentCity?.id,
    filters,
    searchQuery
  );

  // Use visual search results if available, otherwise use fetched listings
  const listings = visualSearchResults || fetchedListings;
  const loading = categoriesLoading || listingsLoading;

  // Handle visual search results
  const handleVisualSearchResults = (results: Listing[]) => {
    setVisualSearchResults(results);
    setSearchQuery("Visual Search Results");
  };

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const fulfillment = searchParams.get("fulfillment");
    const sortBy = searchParams.get("sortBy");

    setFilters({
      category: category || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      fulfillment: (fulfillment as any) || undefined,
      sortBy: (sortBy as any) || "newest",
    });
  }, [searchParams]);

  // Track search analytics when results change
  useEffect(() => {
    if (searchQuery && listings.length >= 0 && currentCity) {
      trackSearch({
        query: searchQuery,
        results_count: listings.length,
        filters_used: filters,
        city_id: currentCity.id,
      });
    }
  }, [searchQuery, listings.length, currentCity, filters, trackSearch]);

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

  // Allow anonymous browsing - user is optional

  // Generate SEO metadata for browse page
  const browseUrl = `https://craftchicagofinds.com/${currentCity.slug}/browse`;
  const categoryFilter = filters.category;
  const selectedCategory = categories.find(c => c.slug === categoryFilter);

  const seoTitle = categoryFilter && selectedCategory
    ? `Browse ${selectedCategory.name} in ${currentCity.name} | Handmade Goods`
    : `Browse Handmade Goods in ${currentCity.name} | Local Artisan Marketplace`;

  const seoDescription = categoryFilter && selectedCategory
    ? `Discover handmade ${selectedCategory.name.toLowerCase()} from local artisans in ${currentCity.name}. Browse ${listings.length}+ unique products. Shop pottery, jewelry, textiles, and more from ${currentCity.name} makers.`
    : `Browse ${listings.length}+ handmade products from local ${currentCity.name} artisans. Filter by category, price, and style. Shop pottery, jewelry, textiles, art, and more. Support local craft.`;

  // CollectionPage Schema
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Handmade Goods in ${currentCity.name}`,
    "description": seoDescription,
    "url": browseUrl,
    "numberOfItems": listings.length,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Craft Chicago Finds",
      "url": "https://craftchicagofinds.com"
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://craftchicagofinds.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": currentCity.name,
        "item": `https://craftchicagofinds.com/${currentCity.slug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Browse"
      }
    ]
  };

  const seoConfig = {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      `${currentCity.name.toLowerCase()} handmade`,
      `${currentCity.name.toLowerCase()} browse`,
      `handmade marketplace ${currentCity.name.toLowerCase()}`,
      'local artisan products',
      'browse handmade goods',
      ...(categoryFilter && selectedCategory ? [selectedCategory.name.toLowerCase()] : []),
      'shop local',
      'artisan crafts'
    ],
    canonical: browseUrl, // Always canonical to base URL, regardless of filters
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'website',
      url: browseUrl,
      image: "https://craftchicagofinds.com/logo-optimized.webp"
    },
    twitter: {
      card: 'summary',
      title: seoTitle,
      description: seoDescription
    },
    schema: [collectionSchema, breadcrumbSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig}>
        {currentCity.state && <meta name="geo.region" content={`US-${currentCity.state}`} />}
        <meta name="geo.placename" content={currentCity.name} />
      </SEOHead>
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
        <div className="space-y-4 mb-8">
          <SearchBar
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setVisualSearchResults(null); // Clear visual search when typing
            }}
            cityId={currentCity.id}
          />
          <div className="flex justify-center">
            <VisualSearch
              onSearchResults={handleVisualSearchResults}
              cityId={currentCity.id}
            />
          </div>
        </div>

        {/* Subtle signup prompt for anonymous users */}
        <SubtleSignupPrompt variant="general" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ReadyTodayFilters
              filters={{
                readyToday: filters.readyToday,
                shipsToday: filters.shipsToday,
                pickupToday: filters.pickupToday,
              }}
              onFiltersChange={(readyFilters) =>
                setFilters({
                  ...filters,
                  ...readyFilters,
                })
              }
            />
            <AdvancedProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={[
                "handmade",
                "organic",
                "custom",
                "vintage",
                "eco-friendly",
              ]}
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
