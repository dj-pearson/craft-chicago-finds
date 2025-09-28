import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MapPin, Package, Truck, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Listing } from "@/pages/Browse";

interface ProductGridProps {
  listings: Listing[];
  loading: boolean;
  currentCity: any;
}

export const ProductGrid = ({ listings, loading, currentCity }: ProductGridProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
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
          <Card 
            key={listing.id}
            className="group cursor-pointer hover:shadow-elevated transition-all duration-300 border-border/50 hover:border-primary/20"
            onClick={() => navigate(`/${currentCity.slug}/product/${listing.id}`)}
          >
            {/* Product Image */}
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement favorites functionality
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>

              {/* Inventory indicator */}
              {listing.inventory_count !== null && listing.inventory_count <= 5 && listing.inventory_count > 0 && (
                <Badge variant="destructive" className="absolute bottom-2 left-2">
                  Only {listing.inventory_count} left
                </Badge>
              )}
              {listing.inventory_count === 0 && (
                <Badge variant="secondary" className="absolute bottom-2 left-2">
                  Sold out
                </Badge>
              )}
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
        ))}
      </div>
    </div>
  );
};