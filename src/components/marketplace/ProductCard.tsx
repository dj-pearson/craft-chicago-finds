/**
 * Product Card Component
 * Displays a product in grid/list view
 */

import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAddToCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    original_price?: number | null;
    main_image_url?: string | null;
    tags?: string[];
    stock_quantity: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate({ productId: product.id });
  };

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.main_image_url || '/placeholder.svg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-2">
        {discount > 0 && (
          <Badge variant="destructive" className="font-semibold">
            {discount}% OFF
          </Badge>
        )}
        {product.stock_quantity < 5 && product.stock_quantity > 0 && (
          <Badge variant="secondary">Only {product.stock_quantity} left</Badge>
        )}
        {product.stock_quantity === 0 && (
          <Badge variant="outline" className="bg-background/80">
            Out of Stock
          </Badge>
        )}
      </div>

      {/* Favorite Button */}
      <button
        className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        aria-label="Add to favorites"
      >
        <Heart className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              ${product.price.toFixed(2)}
            </span>
            {product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.original_price.toFixed(2)}
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || addToCart.isPending}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
