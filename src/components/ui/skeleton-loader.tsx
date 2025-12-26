import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// Re-export the base Skeleton for convenience (uses consistent shimmer animation)
export { Skeleton };

// Product Card Skeleton
export const ProductCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" />
      
      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Price skeleton */}
      <Skeleton className="h-6 w-1/3" />
      
      {/* Seller info skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
};

// Product Grid Skeleton - with min-height to prevent CLS (Cumulative Layout Shift)
export const ProductGridSkeleton = ({ count = 12 }: { count?: number }) => {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]"
      role="status"
      aria-label="Loading products"
      aria-busy="true"
    >
      <span className="sr-only">Loading products...</span>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Order Card Skeleton
export const OrderCardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="flex items-center space-x-3">
        <Skeleton className="h-16 w-16 rounded" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      <div className="flex justify-between">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
};

// Review Skeleton
export const ReviewSkeleton = () => {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <div className="flex space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-3" />
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      
      {/* Photo placeholders */}
      <div className="flex space-x-2">
        <Skeleton className="h-16 w-16 rounded" />
        <Skeleton className="h-16 w-16 rounded" />
      </div>
    </div>
  );
};

// Header Skeleton
export const HeaderSkeleton = () => {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          
          <div className="flex items-center space-x-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Navigation Skeleton
export const CategoryNavSkeleton = () => {
  return (
    <div className="flex space-x-4 overflow-x-auto py-2">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
};

// Chat Message Skeleton
export const ChatMessageSkeleton = ({ isOwn = false }: { isOwn?: boolean }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs space-y-2 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <Skeleton className="h-3 w-16" />
        <Skeleton className={`h-10 w-32 ${isOwn ? 'rounded-l-lg rounded-tr-lg' : 'rounded-r-lg rounded-tl-lg'}`} />
      </div>
    </div>
  );
};

// Seller Dashboard Skeleton
export const DashboardStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-2">
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Product Detail Skeleton - with accessibility attributes
export const ProductDetailSkeleton = () => {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[600px]"
      role="status"
      aria-label="Loading product details"
      aria-busy="true"
    >
      <span className="sr-only">Loading product details...</span>
      {/* Image Gallery Skeleton */}
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded" />
          ))}
        </div>
      </div>

      {/* Product Info Skeleton */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Title */}
        <Skeleton className="h-10 w-3/4" />

        {/* Price */}
        <Skeleton className="h-12 w-32" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Add to Cart Button */}
        <Skeleton className="h-12 w-full" />

        {/* Seller Info */}
        <div className="border-t pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PageLoadingSkeleton - Full page loading skeleton for route-level Suspense
 *
 * SEO-friendly: Provides proper document structure with header/main/footer
 * Accessibility: Includes aria-busy and screen reader announcements
 * CLS Prevention: Fixed min-heights prevent layout shift
 */
export const PageLoadingSkeleton = () => {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Loading page content"
      aria-busy="true"
    >
      <span className="sr-only">Loading page content...</span>

      {/* Header skeleton */}
      <HeaderSkeleton />

      {/* Main content skeleton */}
      <main className="container mx-auto px-4 py-8">
        {/* Page title area */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        {/* Category navigation skeleton */}
        <CategoryNavSkeleton />

        {/* Content grid skeleton */}
        <div className="mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </main>

      {/* Footer skeleton */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
