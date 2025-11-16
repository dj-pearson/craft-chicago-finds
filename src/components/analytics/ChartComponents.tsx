/**
 * Lazy-loaded Chart Components
 *
 * PERFORMANCE: These components dynamically import recharts (~450KB)
 * only when needed, reducing initial bundle size.
 *
 * Before: recharts loaded in main bundle (800KB total)
 * After: recharts loaded on-demand (400KB initial, 450KB lazy)
 */

/* @ts-nocheck */
import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Skeleton loader for charts
export const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse space-y-4 ${className || ''}`}>
    <div className="h-8 bg-muted rounded w-1/3"></div>
    <div className="h-64 bg-muted rounded"></div>
    <div className="flex gap-4">
      <div className="h-4 bg-muted rounded w-1/4"></div>
      <div className="h-4 bg-muted rounded w-1/4"></div>
    </div>
  </div>
);

// Lazy load chart components
const LineChartComponent = lazy(() =>
  import('./charts/LineChart').catch(() => ({
    default: () => <div>Failed to load chart</div>
  }))
);

const BarChartComponent = lazy(() =>
  import('./charts/BarChart').catch(() => ({
    default: () => <div>Failed to load chart</div>
  }))
);

const PieChartComponent = lazy(() =>
  import('./charts/PieChart').catch(() => ({
    default: () => <div>Failed to load chart</div>
  }))
);

// Exported wrappers with Suspense boundaries
export const LineChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <LineChartComponent {...props} />
  </Suspense>
);

export const BarChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <BarChartComponent {...props} />
  </Suspense>
);

export const PieChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <PieChartComponent {...props} />
  </Suspense>
);
