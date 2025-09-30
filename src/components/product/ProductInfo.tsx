import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MapPin, Truck, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MessageStarter } from "@/components/messaging";
import { BuyNowButton } from "./BuyNowButton";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { PersonalizationPreview } from "./PersonalizationPreview";
import { CustomOrderChat } from "./CustomOrderChat";
import { BundleBuilder } from "./BundleBuilder";
import { DeliveryPromiseBar } from "./DeliveryPromiseBar";
import { SellerBadges } from "../seller/SellerBadges";
import { supabase } from "@/integrations/supabase/client";
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
  const [personalizationOptions, setPersonalizationOptions] = useState<any[]>(
    []
  );
  const [personalizations, setPersonalizations] = useState<Record<string, any>>(
    {}
  );
  const [personalizationCost, setPersonalizationCost] = useState(0);
  const [personalizationValid, setPersonalizationValid] = useState(true);
  const { toast } = useToast();

  // Fetch personalization options for this listing
  useEffect(() => {
    const fetchPersonalizationOptions = async () => {
      try {
        // TODO: Implement personalization when personalization_options table exists
        console.log('Personalization options not yet implemented');
        setPersonalizationOptions([]);
      } catch (fetchError) {
        console.error('Error fetching personalization options:', fetchError);
        setPersonalizationOptions([]);
      }
    };

    fetchPersonalizationOptions();
  }, [listing.id]);

  const handlePersonalizationChange = (data: any) => {
    setPersonalizations(data.personalizations || {});
    setPersonalizationCost(data.additionalCost || 0);

    // Validate required fields
    const requiredOptions = personalizationOptions.filter(
      (opt) => opt.is_required
    );
    const isValid = requiredOptions.every(
      (opt) =>
        data.personalizations?.[opt.option_key] &&
        data.personalizations[opt.option_key].trim() !== ""
    );
    setPersonalizationValid(isValid);
  };

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
            <div className="text-3xl font-bold text-primary">
              ${listing.price}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavorite}
              className={isFavorited ? "text-destructive" : ""}
            >
              <Heart
                className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`}
              />
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seller Info with Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sold by</span>
            <span className="font-medium">
              {listing.seller?.display_name || "Unknown Seller"}
            </span>
          </div>
          <SellerBadges />
        </div>

        {/* Inventory Status */}
        {listing.inventory_count !== null && (
          <div>
            {listing.inventory_count === 0 ? (
              <Badge variant="destructive">Sold Out</Badge>
            ) : listing.inventory_count <= 5 ? (
              <Badge variant="destructive">
                Only {listing.inventory_count} left in stock
              </Badge>
            ) : (
              <Badge variant="secondary">
                {listing.inventory_count} in stock
              </Badge>
            )}
          </div>
        )}

        {/* Delivery Promise */}
        <DeliveryPromiseBar
          processingTimeDays={3}
          shippingTimeDays={7}
          fulfillmentMethod={
            listing.local_pickup_available && listing.shipping_available
              ? "both"
              : listing.local_pickup_available
              ? "pickup"
              : "shipping"
          }
          pickupLocation={listing.pickup_location}
        />

        {/* Description */}
        {listing.description && (
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Personalization Options */}
        {personalizationOptions.length > 0 && (
          <>
            <Separator />
            <PersonalizationPreview
              productImage={listing.images?.[0] || ""}
              productTitle={listing.title}
              personalizationOptions={personalizationOptions}
              onPersonalizationChange={handlePersonalizationChange}
            />
          </>
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
          {/* Show total price including personalization */}
          {personalizationCost > 0 && (
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Base price:</span>
                <span>${listing.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Personalization:</span>
                <span>+${personalizationCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span>${(listing.price + personalizationCost).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AddToCartButton
              listing={listing}
              personalizations={personalizations}
              personalizationCost={personalizationCost}
              disabled={!personalizationValid}
            />
            <BuyNowButton listing={listing} />
          </div>
          {listing.seller && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <MessageStarter
                  sellerId={listing.seller_id}
                  listingId={listing.id}
                  sellerName={listing.seller.display_name || "Seller"}
                  buttonText="Send Message"
                  variant="outline"
                />
                <CustomOrderChat
                  listingId={listing.id}
                  sellerId={listing.seller_id}
                  sellerName={listing.seller?.display_name || 'Seller'}
                  productTitle={listing.title}
                />
              </div>
              <BundleBuilder
                currentListing={{
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  image: listing.images?.[0],
                  seller_id: listing.seller_id,
                  seller_name: listing.seller.display_name || "Seller",
                  inventory_count: listing.inventory_count || 0,
                }}
              />
            </div>
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
