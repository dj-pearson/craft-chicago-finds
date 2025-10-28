import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductGridSkeleton } from "@/components/ui/skeleton-loader";
import { ProductCard } from "./ProductCard";
import { useCallback, memo } from "react";
import type { Listing } from "@/pages/Browse";

interface ProductGridProps {
  listings: Listing[];
  loading: boolean;
  currentCity: any;
}

export const ProductGrid = memo(({ listings, loading, currentCity }: ProductGridProps) => {
  const navigate = useNavigate();

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleFavoriteClick = useCallback((listingId: string) => {
    // TODO: Implement favorites functionality
    console.log('Favorite clicked:', listingId);
  }, []);

  if (loading) {
    return <ProductGridSkeleton count={6} />;
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or browse all categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {listings.length} product{listings.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ProductCard
            key={listing.id}
            listing={listing}
            citySlug={currentCity.slug}
            onNavigate={handleNavigate}
            onFavoriteClick={handleFavoriteClick}
          />
        ))}
      </div>
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';