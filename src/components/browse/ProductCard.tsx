import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MapPin, Package, Truck, Eye, Maximize2 } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useFavorites } from "@/hooks/useFavorites";
import { QuickViewModal } from "./QuickViewModal";
import { TrustBadges } from "@/components/ui/trust-badges";
import type { Listing } from "@/pages/Browse";

interface ProductCardProps {
  listing: Listing;
  citySlug: string;
  onNavigate: (path: string) => void;
}

export const ProductCard = memo(({
  listing,
  citySlug,
  onNavigate
}: ProductCardProps) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(listing.id);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const handleCardClick = () => {
    onNavigate(`/${citySlug}/product/${listing.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQuickView(true);
  };

  // Get the image to display (secondary on hover if available)
  const currentImage = isHovered && listing.images && listing.images.length > 1
    ? listing.images[1]
    : listing.images?.[0];

  return (
    <>
      <Card
        className="group cursor-pointer hover:shadow-elevated transition-all duration-300 border-border/50 hover:border-primary/20"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden rounded-t-lg">
          {currentImage ? (
            <LazyImage
              src={currentImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Seller Avatar Overlay - appears on hover */}
          {listing.profiles && (
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Avatar className="h-6 w-6">
                {listing.profiles.avatar_url ? (
                  <LazyImage
                    src={listing.profiles.avatar_url}
                    alt={listing.profiles.display_name || 'Seller'}
                    className="h-full w-full object-cover rounded-full"
                    loading="lazy"
                    sizes="24px"
                  />
                ) : (
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {listing.profiles.display_name?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-xs font-medium">
                {listing.profiles.display_name || 'Local Seller'}
              </span>
              {listing.profiles.seller_verified && (
                <Badge className="h-4 px-1 text-[10px] bg-blue-500 text-white">
                  ✓
                </Badge>
              )}
            </div>
          )}

          {/* Quick View Button - appears on hover */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/90 hover:bg-background backdrop-blur-sm"
            onClick={handleQuickView}
            aria-label="Quick view"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Quick View
          </Button>

        {/* Featured Badge */}
        {listing.featured && (
          <Badge className="absolute top-2 right-12 bg-warning text-warning-foreground opacity-100 group-hover:opacity-0 transition-opacity duration-300">
            Featured
          </Badge>
        )}

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-2 right-2 bg-background/80 hover:bg-background/90 backdrop-blur-sm ${favorited ? 'text-red-500' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
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

        {/* Trust Badges */}
        <TrustBadges
          verified={listing.profiles?.seller_verified}
          localMade={true}
          handmade={true}
          fastShipping={listing.ships_today}
          className="mb-3"
          compact={true}
        />

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {listing.description || "No description available"}
        </p>

        {/* Seller */}
        {listing.profiles && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              {listing.profiles.avatar_url ? (
                <LazyImage
                  src={listing.profiles.avatar_url}
                  alt={listing.profiles.display_name || 'Seller'}
                  className="h-full w-full object-cover rounded-full"
                  loading="lazy"
                  sizes="24px"
                />
              ) : (
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {listing.profiles.display_name?.charAt(0).toUpperCase() || 'S'}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {listing.profiles.display_name || 'Local Seller'}
            </span>
            {listing.profiles.seller_verified && (
              <Badge className="h-4 px-1 text-[10px] bg-blue-500 text-white">
                ✓
              </Badge>
            )}
          </div>
        )}

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

    {/* Quick View Modal */}
    <QuickViewModal
      listing={listing}
      citySlug={citySlug}
      open={showQuickView}
      onOpenChange={setShowQuickView}
      onNavigate={onNavigate}
    />
  </>
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
