import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MapPin, Package, Truck, Eye, ExternalLink } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useFavorites } from "@/hooks/useFavorites";
import { TrustBadges } from "@/components/ui/trust-badges";
import { useState } from "react";
import type { Listing } from "@/pages/Browse";

interface QuickViewModalProps {
  listing: Listing;
  citySlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (path: string) => void;
}

export function QuickViewModal({
  listing,
  citySlug,
  open,
  onOpenChange,
  onNavigate
}: QuickViewModalProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(listing.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleViewFullDetails = () => {
    onOpenChange(false);
    onNavigate(`/${citySlug}/product/${listing.id}`);
  };

  const handleFavoriteClick = () => {
    toggleFavorite(listing.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick View: {listing.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square relative overflow-hidden rounded-lg border">
              {listing.images && listing.images.length > 0 ? (
                <LazyImage
                  src={listing.images[selectedImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}

              {/* Featured Badge */}
              {listing.featured && (
                <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground">
                  Featured
                </Badge>
              )}

              {/* Status Badges */}
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
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <LazyImage
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-4">
            {/* Category */}
            {listing.categories && (
              <Badge variant="outline">
                {listing.categories.name}
              </Badge>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground">
              {listing.title}
            </h2>

            {/* Trust Badges */}
            <TrustBadges
              verified={listing.profiles?.seller_verified}
              localMade={true}
              handmade={true}
              fastShipping={listing.ships_today}
              responsive={true}
            />

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">
                ${listing.price}
              </span>
              {listing.view_count && listing.view_count > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{listing.view_count} views</span>
                </div>
              )}
            </div>

            {/* Inventory Status */}
            {listing.inventory_count !== null && listing.inventory_count <= 5 && listing.inventory_count > 0 && (
              <Badge variant="destructive">
                Only {listing.inventory_count} left
              </Badge>
            )}
            {listing.inventory_count === 0 && (
              <Badge variant="secondary">
                Sold out
              </Badge>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {listing.description || "No description available"}
              </p>
            </div>

            {/* Seller */}
            {listing.profiles && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  {listing.profiles.avatar_url ? (
                    <img
                      src={listing.profiles.avatar_url}
                      alt={listing.profiles.display_name || 'Seller'}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {listing.profiles.display_name?.charAt(0).toUpperCase() || 'S'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {listing.profiles.display_name || 'Local Seller'}
                    </p>
                    {listing.profiles.seller_verified && (
                      <Badge className="h-4 px-1 text-[10px] bg-blue-500 text-white">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Chicago, IL</p>
                  {listing.profiles.bio && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {listing.profiles.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fulfillment Options */}
            <div>
              <h3 className="font-semibold mb-2">Fulfillment</h3>
              <div className="flex gap-2">
                {listing.local_pickup_available && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Local Pickup
                  </Badge>
                )}
                {listing.shipping_available && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Shipping Available
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleFavoriteClick}
                className="flex-1"
              >
                <Heart className={`h-4 w-4 mr-2 ${favorited ? 'fill-current text-red-500' : ''}`} />
                {favorited ? 'Saved' : 'Save'}
              </Button>
              <Button
                size="lg"
                onClick={handleViewFullDetails}
                className="flex-1"
              >
                View Full Details
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
