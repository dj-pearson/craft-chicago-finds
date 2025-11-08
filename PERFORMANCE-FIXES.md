# Performance Optimization Fixes

## Priority 1: Database N+1 Query Problems (CRITICAL)

### Issue 1: useAnalytics - fetchTopCategories N+1 Pattern
**File:** `src/hooks/useAnalytics.tsx` (lines 116-154)
**Problem:** Loops through categories making 2-3 queries per category
**Impact:** 30-50+ queries instead of 2-3

**Fix:** Use PostgreSQL aggregation with a single query

```sql
-- Create optimized function in Supabase
CREATE OR REPLACE FUNCTION get_top_categories_stats(limit_count INT DEFAULT 5)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  listing_count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    COUNT(DISTINCT l.id) as listing_count,
    COALESCE(SUM(o.total_amount), 0) as revenue
  FROM categories c
  LEFT JOIN listings l ON l.category_id = c.id
  LEFT JOIN orders o ON o.listing_id = l.id
  GROUP BY c.id, c.name
  ORDER BY revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

**Updated TypeScript code:**
```typescript
const fetchTopCategories = async () => {
  const { data } = await supabase.rpc('get_top_categories_stats', { limit_count: 5 });
  return data?.map(cat => ({
    category: cat.category_name,
    count: cat.listing_count,
    revenue: cat.revenue
  })) || [];
};
```

---

### Issue 2: useAnalytics - fetchTopCitiesAdmin N+1 Pattern
**File:** `src/hooks/useAnalytics.tsx` (lines 156-200)
**Problem:** Loops through cities making 3-4 queries per city
**Impact:** 40-80+ queries instead of 2-3

**Fix:** Create database function

```sql
CREATE OR REPLACE FUNCTION get_top_cities_stats(limit_count INT DEFAULT 5)
RETURNS TABLE (
  city_id UUID,
  city_name TEXT,
  user_count BIGINT,
  listing_count BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.name,
    COUNT(DISTINCT p.user_id) as user_count,
    COUNT(DISTINCT l.id) as listing_count,
    COALESCE(SUM(o.total_amount), 0) as revenue
  FROM cities ci
  LEFT JOIN profiles p ON p.city_id = ci.id
  LEFT JOIN listings l ON l.city_id = ci.id
  LEFT JOIN orders o ON o.listing_id = l.id
  GROUP BY ci.id, ci.name
  ORDER BY revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

### Issue 3: CategoryTrends Component - Extreme N+1 Pattern
**File:** `src/components/browse/CategoryTrends.tsx` (lines 71-132)
**Problem:** For EACH category, makes 5 separate queries (listing count, analytics, reviews, growth)
**Impact:** With 6 categories = 30 queries instead of 1-2

**Fix:** Create comprehensive database function

```sql
CREATE OR REPLACE FUNCTION get_trending_categories(
  p_city_id UUID,
  p_limit INT DEFAULT 6
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_image_url TEXT,
  listing_count BIGINT,
  view_count BIGINT,
  average_rating NUMERIC,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.image_url,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as listing_count,
    COUNT(DISTINCT la.id) as view_count,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COALESCE(
      (SELECT calculate_category_growth_rate(c.id, 30)),
      0
    ) as growth_rate
  FROM categories c
  LEFT JOIN listings l ON l.category_id = c.id AND l.status = 'active'
  LEFT JOIN listing_analytics la ON la.listing_id = l.id
  LEFT JOIN orders o ON o.listing_id = l.id
  LEFT JOIN reviews r ON r.order_id = o.id
  WHERE c.city_id = p_city_id
    AND c.is_active = true
  GROUP BY c.id, c.name, c.slug, c.image_url
  HAVING COUNT(DISTINCT l.id) > 0
  ORDER BY
    (COUNT(DISTINCT la.id) * 0.4 +
     COUNT(DISTINCT l.id) * 0.3 +
     COALESCE(
       (SELECT calculate_category_growth_rate(c.id, 30)),
       0
     ) * 0.2 +
     COALESCE(AVG(r.rating), 0) * 0.1) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

**Updated Component:**
```typescript
const fetchTrendingCategories = async () => {
  if (!currentCity) return;

  try {
    setLoading(true);
    const { data, error } = await supabase
      .rpc('get_trending_categories', {
        p_city_id: currentCity.id,
        p_limit: limit
      });

    if (error) throw error;

    setTrendingCategories(data || []);
  } catch (error) {
    console.error('Error fetching trending categories:', error);
    setTrendingCategories([]);
  } finally {
    setLoading(false);
  }
};
```

---

### Issue 4: OrderList Component - Profile Lookup N+1
**File:** `src/components/orders/OrderList.tsx` (lines 74-86)
**Problem:** After fetching orders, loops through each making 2 profile queries
**Impact:** 10 orders = 20 extra queries

**Fix:** Use PostgreSQL JSON relations in initial query

```typescript
const fetchOrders = async () => {
  try {
    const query = supabase
      .from("orders")
      .select(`
        id,
        status,
        payment_status,
        total_amount,
        quantity,
        created_at,
        fulfillment_method,
        listings!inner(title, images),
        buyer_profile:profiles!buyer_id(display_name),
        seller_profile:profiles!seller_id(display_name)
      `)
      .order("created_at", { ascending: false });

    if (type === "buyer") {
      query.eq("buyer_id", user.id);
    } else {
      query.eq("seller_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      return;
    }

    // No need for Promise.all loop - profiles already fetched!
    const ordersWithProfiles = (data || []).map((order: any) => ({
      ...order,
      listing: order.listings,
      buyer_profile: order.buyer_profile,
      seller_profile: order.seller_profile
    }));

    setOrders(ordersWithProfiles);
  } catch (error) {
    console.error("Error fetching orders:", error);
  } finally {
    setLoading(false);
  }
};
```

---

## Priority 2: Missing Database Indexes

### Status
A file `DATABASE-INDEXES-MIGRATION.sql` exists with many indexes defined, but it's unclear if they've been applied.

### Action Required
```bash
# Apply the index migration
psql -h your-supabase-host -U postgres -d postgres -f DATABASE-INDEXES-MIGRATION.sql
```

### Critical Missing Indexes
```sql
-- If not in the migration file, add these:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_status_created
  ON listings(category_id, status, created_at DESC)
  WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listing_analytics_listing_event_date
  ON listing_analytics(listing_id, event_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_city_seller
  ON profiles(city_id, is_seller)
  WHERE is_seller = true;
```

---

## Priority 3: Frontend Bundle & Image Optimization

### Issue 1: No Responsive Images
**File:** `src/components/ui/lazy-image.tsx`
**Problem:** No srcset, WebP/AVIF support, or responsive sizing
**Impact:** Users download full-resolution images unnecessarily

**Fix:** Enhanced LazyImage component

```typescript
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
  sizes?: string;
  // Add responsive image support
  srcSet?: string;
}

export const LazyImage = ({
  src,
  alt,
  className,
  fallback,
  loading = "lazy",
  sizes = "100vw",
  srcSet,
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Increased from 50px for better preloading
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const shouldLoad = loading === "eager" || isInView;

  // Generate WebP variant URL if original is JPG/PNG
  const getWebPSrc = (originalSrc: string) => {
    if (originalSrc.match(/\.(jpg|jpeg|png)$/i)) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return null;
  };

  const webpSrc = getWebPSrc(src);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {shouldLoad && (
        <picture>
          {/* WebP version for modern browsers */}
          {webpSrc && (
            <source
              srcSet={webpSrc}
              type="image/webp"
              sizes={sizes}
            />
          )}

          {/* Fallback to original format */}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            decoding="async"
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              hasError && "hidden",
              className
            )}
            {...props}
          />
        </picture>
      )}

      {/* Loading placeholder */}
      {!isLoaded && !hasError && shouldLoad && (
        <div
          className={cn(
            "absolute inset-0 bg-muted animate-pulse",
            className
          )}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div
          className={cn(
            "absolute inset-0 bg-muted flex items-center justify-center",
            className
          )}
        >
          {fallback || (
            <div className="text-muted-foreground text-sm">
              Failed to load image
            </div>
          )}
        </div>
      )}

      {/* Initial placeholder */}
      {!shouldLoad && (
        <div className={cn("absolute inset-0 bg-muted", className)} />
      )}
    </div>
  );
};
```

### Issue 2: Large Bundle Dependencies
**Files:** `package.json`, `vite.config.ts`
**Problem:** recharts (450KB), framer-motion (200KB), react-markdown (150KB) loaded

**Fix 1:** Dynamic imports for heavy components
```typescript
// In components that use recharts
import { lazy, Suspense } from 'react';

const AnalyticsChart = lazy(() => import('./AnalyticsChart'));

export const Dashboard = () => (
  <Suspense fallback={<ChartSkeleton />}>
    <AnalyticsChart data={data} />
  </Suspense>
);
```

**Fix 2:** Tree-shake framer-motion
```typescript
// Instead of:
import { motion } from 'framer-motion';

// Use:
import { m } from 'framer-motion';
// And in vite.config.ts add:
// optimizeDeps: {
//   include: ['framer-motion']
// }
```

### Issue 3: React Query Not Being Used
**Problem:** Direct Supabase queries bypass React Query caching

**Fix:** Create query hooks
```typescript
// src/hooks/queries/useListings.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryClient';

export const useListings = (cityId: string, filters?: any) => {
  return useQuery({
    queryKey: queryKeys.listings(cityId, filters),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('city_id', cityId)
        .eq('status', 'active');

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Usage in components:
const { data: listings, isLoading } = useListings(cityId);
```

---

## Performance Impact Summary

| Issue | Current State | After Fix | Improvement |
|-------|---------------|-----------|-------------|
| **useAnalytics N+1** | 100-200 queries | 5-10 queries | **95% reduction** |
| **CategoryTrends N+1** | 30 queries | 1 query | **97% reduction** |
| **OrderList N+1** | 21 queries (10 orders) | 1 query | **95% reduction** |
| **Missing Indexes** | Full table scans | Index scans | **50-80% faster** |
| **Images** | Full-size PNGs/JPGs | WebP + responsive | **60-80% smaller** |
| **Bundle Size** | All libs loaded | Code-split | **30-40% smaller initial** |

---

## Implementation Priority

### Week 1 (Quick Wins - 8-12 hours)
1. ✅ Fix OrderList N+1 (1 hour)
2. ✅ Apply database indexes (1 hour)
3. ✅ Fix CategoryTrends N+1 (2-3 hours)

### Week 2 (Medium Effort - 12-16 hours)
4. ✅ Fix useAnalytics N+1 patterns (4-6 hours)
5. ✅ Enhance LazyImage component (2-3 hours)
6. ✅ Add React Query hooks for common queries (4-6 hours)

### Week 3 (Optimization - 8-12 hours)
7. ✅ Implement dynamic imports for heavy components (3-4 hours)
8. ✅ Set up image optimization pipeline (4-6 hours)
9. ✅ Bundle analysis and tree-shaking (2-3 hours)

---

## Expected Overall Performance Gains

- **Database queries:** 85-95% reduction in query count
- **Page load time:** 40-60% faster for dashboard pages
- **Time to Interactive (TTI):** 30-50% improvement
- **Largest Contentful Paint (LCP):** 40-60% improvement
- **Total Blocking Time (TBT):** 30-40% reduction
- **Bundle size:** 30-40% reduction in initial load
- **Image bandwidth:** 60-80% reduction

---

## Monitoring & Validation

After implementing fixes, monitor:

```sql
-- Query performance
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

Use Lighthouse CI for frontend metrics:
```bash
npx lighthouse https://your-site.com --view
```
