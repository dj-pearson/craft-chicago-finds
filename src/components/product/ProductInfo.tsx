import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MapPin, Truck, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MessageStarter } from "@/components/messaging";
import { BuyNowButton } from "./BuyNowButton";
import type { Listing } from "@/pages/Browse";

interface ProductInfoProps {
  listing: Listing & {
    seller?: {
      id: string;
      display_name: string;
    };
  };
}

export const ProductInfo = ({ listing }: ProductInfoProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited 
        ? "This item has been removed from your favorites."
        : "This item has been added to your favorites.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link has been copied to your clipboard.",
      });
    }
  };

  const handleContact = () => {
    toast({
      title: "Contact seller",
      description: "Use the message button to contact the seller directly.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            {listing.categories && (
              <Badge variant="outline">{listing.categories.name}</Badge>
            )}
            <CardTitle className="text-2xl">{listing.title}</CardTitle>
            <div className="text-3xl font-bold text-primary">${listing.price}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavorite}
              className={isFavorited ? "text-destructive" : ""}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Inventory Status */}
        {listing.inventory_count !== null && (
          <div>
            {listing.inventory_count === 0 ? (
              <Badge variant="destructive">Sold Out</Badge>
            ) : listing.inventory_count <= 5 ? (
              <Badge variant="destructive">Only {listing.inventory_count} left in stock</Badge>
            ) : (
              <Badge variant="secondary">{listing.inventory_count} in stock</Badge>
            )}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        <Separator />

        {/* Fulfillment Options */}
        <div>
          <h3 className="font-semibold mb-3">Fulfillment Options</h3>
          <div className="space-y-2">
            {listing.local_pickup_available && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">Local pickup available</span>
                {listing.pickup_location && (
                  <span className="text-sm text-muted-foreground">
                    at {listing.pickup_location}
                  </span>
                )}
              </div>
            )}
            {listing.shipping_available && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm">Shipping available</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-3">
          <BuyNowButton listing={listing} />
          {listing.seller && (
            <MessageStarter
              sellerId={listing.seller_id}
              listingId={listing.id}
              sellerName={listing.seller.display_name || "Seller"}
              buttonText="Send Message"
              variant="outline"
            />
          )}
        </div>

        {/* Product Details */}
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">Product Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Listed:</span>
              <span className="ml-2">
                {new Date(listing.created_at).toLocaleDateString()}
              </span>
            </div>
            {listing.view_count && (
              <div>
                <span className="text-muted-foreground">Views:</span>
                <span className="ml-2">{listing.view_count}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};