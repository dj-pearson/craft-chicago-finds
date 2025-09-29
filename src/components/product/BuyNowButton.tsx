import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripeCheckout } from "@/components/checkout/StripeCheckout";
import { ShoppingCart, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface BuyNowButtonProps {
  listing: {
    id: string;
    title: string;
    price: number;
    seller_id: string;
    inventory_count: number | null;
    local_pickup_available: boolean;
    shipping_available: boolean;
    pickup_location?: string;
  };
}

export const BuyNowButton = ({ listing }: BuyNowButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleBuyNow = () => {
    // Allow guest purchases - no need to require authentication

    if (user && user.id === listing.seller_id) {
      toast({
        title: "Cannot purchase",
        description: "You cannot purchase your own listing.",
        variant: "destructive",
      });
      return;
    }

    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (orderId: string) => {
    setShowCheckout(false);
    toast({
      title: "Order placed successfully!",
      description: "You can track your order in the Orders page.",
    });
    navigate("/orders");
  };

  const isAvailable =
    listing.inventory_count === null || listing.inventory_count > 0;
  const isSeller = user && user.id === listing.seller_id;

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        disabled={!isAvailable || isSeller}
        onClick={handleBuyNow}
      >
        {!isAvailable ? (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sold Out
          </>
        ) : isSeller ? (
          "Your Listing"
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Buy Now - ${listing.price}
          </>
        )}
      </Button>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase {listing.title}</DialogTitle>
          </DialogHeader>
          <StripeCheckout
            listing={listing}
            onSuccess={handleCheckoutSuccess}
            onCancel={() => setShowCheckout(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
