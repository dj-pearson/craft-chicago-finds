import { useQuery } from '@tanstack/react-query';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCityContext } from '@/hooks/useCityContext';
import { cn } from '@/lib/utils';

interface RecentlyViewedProductsProps {
  excludeId?: string;
  className?: string;
}

export const RecentlyViewedProducts = ({ excludeId, className }: RecentlyViewedProductsProps) => {
  const { recentlyViewed, clearRecentlyViewed, hasRecentlyViewed } = useRecentlyViewed();
  const { currentCity } = useCityContext();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter out current product
  const productIds = excludeId
    ? recentlyViewed.filter(id => id !== excludeId)
    : recentlyViewed;

  // Fetch product data for recently viewed IDs
  const { data: products = [] } = useQuery({
    queryKey: ['recently-viewed-products', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, images, seller_id, profiles:seller_id(display_name)')
        .in('id', productIds.slice(0, 12))
        .eq('status', 'active');
      if (error) throw error;
      // Preserve the order from recentlyViewed
      const dataMap = new Map((data || []).map(item => [item.id, item]));
      return productIds
        .map(id => dataMap.get(id))
        .filter(Boolean) as typeof data;
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (!hasRecentlyViewed || products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Recently Viewed</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll('left')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll('right')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentlyViewed}
            className="text-muted-foreground text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Card
            key={product.id}
            className="flex-shrink-0 w-[200px] sm:w-[220px] snap-start cursor-pointer group hover:shadow-md transition-shadow"
            onClick={() => navigate(`/${currentCity?.slug || 'chicago'}/product/${product.id}`)}
          >
            <CardContent className="p-0">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <LazyImage
                  src={product.images?.[0] || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 space-y-1">
                <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h4>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    ${product.price}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate ml-2">
                    {(product.profiles as any)?.display_name || 'Local Maker'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
