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
import { FeaturedCollections } from "@/components/collections/FeaturedCollections";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { useListings, type Listing, type FilterOptions } from "@/hooks/queries/useListings";
import { useCategories, type Category } from "@/hooks/queries/useCategories";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { ProductGridSkeleton } from "@/components/ui/skeleton-loader";
import { FAQSection } from "@/components/seo/FAQSection";
import { getCategoryContent } from "@/components/seo/CategoryContent";
import { AISearchOptimization } from "@/components/seo/AISearchOptimization";
import { Card, CardContent } from "@/components/ui/card";

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

  // Show loading state with skeleton
  if (authLoading || cityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-10 w-64 bg-muted animate-pulse rounded mb-4" />
            <div className="h-6 w-96 bg-muted animate-pulse rounded" />
          </div>
          <ProductGridSkeleton count={12} />
        </main>
        <Footer />
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
  const browseUrl = `${window.location.origin}/${currentCity.slug}/browse`;
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
      "url": window.location.origin
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
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": currentCity.name,
        "item": `${window.location.origin}/${currentCity.slug}`
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
      image: `${window.location.origin}/logo-optimized.webp`
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

      {/* AI Search Optimization - Structured data for ChatGPT, Perplexity, Google AI */}
      <AISearchOptimization
        pageType="category"
        content={{
          directAnswer: categoryFilter && selectedCategory
            ? `Browse ${listings.length}+ handmade ${selectedCategory.name.toLowerCase()} from local artisans in ${currentCity.name}. Shop unique, locally-made products on Craft Chicago Finds.`
            : `Browse ${listings.length}+ handmade products from local ${currentCity.name} artisans. Craft Chicago Finds offers pottery, jewelry, textiles, art and more with only 10% commission.`,
          keyFacts: [
            `${listings.length}+ handmade products available`,
            `All products made by verified ${currentCity.name} artisans`,
            '10% commission (vs Etsy\'s 20-25%)',
            '70% of makers offer same-day local pickup',
            'Filter by category, price, and fulfillment options',
            'For every $100 spent, $68 stays in Chicago\'s economy'
          ],
          entities: [
            { name: `${currentCity.name} Handmade Marketplace`, type: 'CollectionPage', description: `Browse handmade goods from ${currentCity.name} artisans` },
            { name: 'Craft Chicago Finds', type: 'Organization', description: 'Chicago\'s marketplace for local handmade goods' },
            ...(selectedCategory ? [{ name: selectedCategory.name, type: 'Category', description: `Handmade ${selectedCategory.name.toLowerCase()} from ${currentCity.name} makers` }] : [])
          ],
          faqs: [
            { question: `Where can I buy handmade goods in ${currentCity.name}?`, answer: `Craft Chicago Finds is ${currentCity.name}'s premier marketplace for handmade goods. Browse ${listings.length}+ products from verified local artisans with same-day pickup options.` },
            { question: 'How is Craft Chicago Finds different from Etsy?', answer: 'Craft Chicago Finds charges only 10% commission (vs Etsy\'s 20-25%), focuses exclusively on verified local makers, and offers same-day local pickup from 70% of sellers.' },
            { question: 'Can I pick up items locally?', answer: `Yes! 70% of ${currentCity.name} makers on Craft Chicago Finds offer same-day local pickup. Use the "Ready Today" filter to find items available for immediate pickup.` }
          ],
          citations: [
            { claim: `${listings.length}+ handmade products from ${currentCity.name} artisans`, source: 'Craft Chicago Finds', url: browseUrl },
            { claim: '10% commission vs Etsy\'s 20-25%', source: 'Craft Chicago Finds Pricing', url: `${window.location.origin}/pricing` }
          ]
        }}
      />
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

        {/* Featured Collections - Show when no search query */}
        {!searchQuery && !visualSearchResults && (
          <div className="mb-8">
            <FeaturedCollections limit={3} showHeader={true} />
          </div>
        )}

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

        {/* Category-Specific SEO Content */}
        {filters.category && !searchQuery && (() => {
          const categoryContent = getCategoryContent(filters.category);
          const hasContent = categoryContent.intro || categoryContent.faqs.length > 0;

          if (!hasContent) return null;

          return (
            <div className="mt-16 space-y-8">
              {/* Category Introduction */}
              {categoryContent.intro && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-4">
                      {categoryContent.intro.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {categoryContent.intro.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Category FAQs */}
              {categoryContent.faqs.length > 0 && (
                <FAQSection
                  title={`Frequently Asked Questions`}
                  faqs={categoryContent.faqs}
                />
              )}
            </div>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
