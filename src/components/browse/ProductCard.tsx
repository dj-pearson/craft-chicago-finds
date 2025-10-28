import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MapPin, Package, Truck, Eye } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Listing } from "@/pages/Browse";

interface ProductCardProps {
  listing: Listing;
  citySlug: string;
  onNavigate: (path: string) => void;
  onFavoriteClick?: (listingId: string) => void;
}

export const ProductCard = memo(({ 
  listing, 
  citySlug, 
  onNavigate,
  onFavoriteClick 
}: ProductCardProps) => {
  const handleCardClick = () => {
    onNavigate(`/${citySlug}/product/${listing.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick?.(listing.id);
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-elevated transition-all duration-300 border-border/50 hover:border-primary/20"
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        {listing.images && listing.images.length > 0 ? (
          <LazyImage
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Featured Badge */}
        {listing.featured && (
          <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground">
            Featured
          </Badge>
        )}

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
          onClick={handleFavoriteClick}
        >
          <Heart className="h-4 w-4" />
        </Button>

        {/* Ready Today Badges */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {listing.ready_today && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
              <Package className="h-3 w-3 mr-1" />
              Ready Today
            </Badge>
          )}
          {listing.ships_today && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
              <Truck className="h-3 w-3 mr-1" />
              Ships Today
            </Badge>
          )}
          {listing.pickup_today && (
            <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              Pickup Today
            </Badge>
          )}
          
          {/* Inventory indicator */}
          {listing.inventory_count !== null && listing.inventory_count <= 5 && listing.inventory_count > 0 && (
            <Badge variant="destructive" className="text-xs">
              Only {listing.inventory_count} left
            </Badge>
          )}
          {listing.inventory_count === 0 && (
            <Badge variant="secondary" className="text-xs">
              Sold out
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Category */}
        {listing.categories && (
          <Badge variant="outline" className="mb-2">
            {listing.categories.name}
          </Badge>
        )}

        {/* Title */}
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {listing.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {listing.description || "No description available"}
        </p>

        {/* Seller */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              S
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            Local Seller
          </span>
        </div>

        {/* Fulfillment options */}
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          {listing.local_pickup_available && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Pickup</span>
            </div>
          )}
          {listing.shipping_available && (
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>Shipping</span>
            </div>
          )}
        </div>

        {/* Price and views */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-foreground">
            ${listing.price}
          </span>
          {listing.view_count && listing.view_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{listing.view_count}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.listing.view_count === nextProps.listing.view_count &&
    prevProps.listing.inventory_count === nextProps.listing.inventory_count &&
    prevProps.citySlug === nextProps.citySlug
  );
});

ProductCard.displayName = 'ProductCard';
