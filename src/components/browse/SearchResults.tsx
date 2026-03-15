import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  MapPin,
  Star,
  Clock,
  TrendingUp,
  Filter,
  X,
  PackageSearch
} from "lucide-react";
import { VirtualizedList } from "@/components/ui/virtualized-list";
import { LazyImage } from "@/components/ui/lazy-image";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton-loader";
import { EmptyState } from "@/components/ui/empty-state";
import type { Listing, Category } from "@/pages/Browse";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  listings: Listing[];
  categories: Category[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalResults?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'newest' | 'price_low' | 'price_high' | 'rating' | 'distance';

// Common craft marketplace terms for spelling suggestions
const KNOWN_TERMS: Record<string, string[]> = {
  ceramics: ['cermaics', 'ceramcs', 'ceramik', 'cermics', 'cerimics'],
  jewelry: ['jewlery', 'jewellery', 'jewlry', 'jewelery', 'jewerly'],
  candles: ['candels', 'candles', 'candls', 'kandels'],
  pottery: ['poterry', 'potery', 'potary', 'pottrey'],
  textiles: ['texiles', 'textils', 'textiels'],
  macrame: ['macramé', 'makrame', 'macramae', 'macrme'],
  earrings: ['earings', 'earrigns', 'earrins', 'erring'],
  necklace: ['necklase', 'necklass', 'necklce', 'neckace'],
  handmade: ['hand made', 'handmaid', 'handmde'],
  crochet: ['croche', 'crotchet', 'crochett', 'crocet'],
  knitting: ['kniting', 'knittig', 'kniting'],
  woodwork: ['woodwrok', 'wood work', 'woodwrk'],
  painting: ['panting', 'painitng', 'paintng'],
  sculpture: ['sculture', 'scuplture', 'sculputre'],
};

function getSpellingSuggestions(query: string): string[] {
  const q = query.toLowerCase().trim();
  const suggestions: string[] = [];
  for (const [correct, misspellings] of Object.entries(KNOWN_TERMS)) {
    if (misspellings.some((m) => q.includes(m)) || levenshtein(q, correct) <= 2) {
      if (q !== correct) suggestions.push(correct);
    }
  }
  return suggestions.slice(0, 3);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

export const SearchResults = ({
  listings,
  categories,
  loading,
  searchQuery,
  onSearchChange,
  totalResults = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: SearchResultsProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  
  // Search analytics
  useEffect(() => {
    if (searchQuery && listings.length > 0) {
      // Track search result interaction - only log in development
      if (import.meta.env.DEV) {
        console.log(`Search "${searchQuery}" returned ${totalResults} results`);
      }
    }
  }, [searchQuery, listings.length, totalResults]);

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    // This would trigger re-sorting in parent component
  };

  const renderListingCard = (listing: Listing, index: number) => {
    const isGridView = viewMode === 'grid';
    
    return (
      <Card
        key={listing.id}
        className={cn(
          "group hover:shadow-elevated transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20",
          isGridView ? "h-full" : "flex-row overflow-hidden"
        )}
      >
        <CardContent className={cn("p-0", isGridView ? "" : "flex")}>
          {/* Image */}
          <div className={cn(
            "relative overflow-hidden",
            isGridView ? "aspect-square" : "w-48 h-32 flex-shrink-0"
          )}>
            <LazyImage
              src={listing.images?.[0] || '/placeholder.svg'}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {listing.featured && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                Featured
              </Badge>
            )}
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary" className="text-xs">
                ${listing.price}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className={cn("p-4", isGridView ? "" : "flex-1")}>
            <div className="space-y-2">
              <h3 className={cn(
                "font-semibold group-hover:text-primary transition-colors line-clamp-2",
                isGridView ? "text-lg" : "text-base"
              )}>
                {listing.title}
              </h3>
              
              {!isGridView && listing.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
              )}

              {/* Seller info */}
              {listing.profiles && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{listing.profiles.display_name || 'Unknown Seller'}</span>
                  {listing.profiles.seller_verified && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              )}

              {/* Category */}
              {listing.categories && (
                <Badge variant="secondary" className="text-xs">
                  {listing.categories.name}
                </Badge>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {listing.view_count && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {listing.view_count} views
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(listing.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Availability */}
              <div className="flex gap-1">
                {listing.local_pickup_available && (
                  <Badge variant="outline" className="text-xs">
                    Pickup
                  </Badge>
                )}
                {listing.shipping_available && (
                  <Badge variant="outline" className="text-xs">
                    Shipping
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Search header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
        {/* Product grid skeleton */}
        <ProductGridSkeleton count={9} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Products'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most relevant</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price_low">Price: Low to high</SelectItem>
              <SelectItem value="price_high">Price: High to low</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="distance">Nearest first</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filters */}
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              {/* Mobile filter content would go here */}
              <p className="text-sm text-muted-foreground">
                Filter options for mobile view
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* No Results */}
      {listings.length === 0 && !loading && (
        <div className="py-12 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <PackageSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `We couldn't find any products matching "${searchQuery}"`
                : "No products match your current filters"
              }
            </p>
          </div>

          {/* Spelling Suggestions */}
          {searchQuery && (() => {
            const suggestions = getSpellingSuggestions(searchQuery);
            if (suggestions.length === 0) return null;
            return (
              <div className="mb-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Did you mean:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => onSearchChange(suggestion)}
                      className="text-primary"
                    >
                      <Search className="h-3 w-3 mr-1.5" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Category Suggestions */}
          {categories.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3 text-center">Browse by category instead:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.slice(0, 8).map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm"
                    onClick={() => onSearchChange('')}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Popular Search Terms */}
          {searchQuery && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3 text-center">Popular searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['ceramics', 'jewelry', 'candles', 'pottery', 'art prints', 'textiles'].map((term) => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm"
                    onClick={() => onSearchChange(term)}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Tips */}
          <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-sm font-medium mb-2">Search tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Try broader terms like "jewelry" or "ceramics"
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Check your spelling
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">•</span>
                Use fewer keywords
              </li>
            </ul>
          </div>

          {/* Clear Search Button */}
          {searchQuery && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4 mr-2" />
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Grid/List */}
      {listings.length > 0 && (
        <div className={cn(
          "gap-6",
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
            : "space-y-4"
        )}>
          {listings.map((listing, index) => renderListingCard(listing, index))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange?.(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};