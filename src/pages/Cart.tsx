import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GiftModeToggle } from "@/components/cart/GiftModeToggle";
import { SubtleSignupPrompt } from "@/components/auth/SubtleSignupPrompt";

export const CartPage = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    itemCount,
  } = useCart();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [giftMode, setGiftMode] = useState({
    enabled: false,
    message: "",
    recipientEmail: "",
    scheduledShipDate: "",
    hidePrices: false,
  });

  const platformFeeRate = 0.1; // 10%
  const platformFee = totalAmount * platformFeeRate;
  const finalTotal = totalAmount + platformFee;

  // Group items by seller for better organization
  const itemsBySeller = items.reduce((acc, item) => {
    if (!acc[item.seller_id]) {
      acc[item.seller_id] = {
        seller_name: item.seller_name,
        items: [],
      };
    }
    acc[item.seller_id].items.push(item);
    return acc;
  }, {} as Record<string, { seller_name: string; items: typeof items }>);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    navigate("/checkout", { state: { giftMode } });
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Browse our marketplace to find amazing handcrafted items from
                local makers.
              </p>
              <Button onClick={() => navigate("/browse")} className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Badge>
        </div>

        {/* Subtle signup prompt for anonymous users */}
        <SubtleSignupPrompt variant="cart" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(itemsBySeller).map(
              ([sellerId, { seller_name, items: sellerItems }]) => (
                <Card key={sellerId}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      From {seller_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sellerItems.map((item) => (
                      <div
                        key={item.listing_id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {item.seller_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold">${item.price}</span>
                            {item.shipping_available && (
                              <Badge variant="outline" className="text-xs">
                                Shipping
                              </Badge>
                            )}
                            {item.local_pickup_available && (
                              <Badge variant="outline" className="text-xs">
                                Pickup
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.listing_id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.listing_id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 text-center"
                            min="1"
                            max={item.max_quantity}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.listing_id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.max_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.listing_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            )}

            {/* Gift Mode */}
            <GiftModeToggle
              giftMode={giftMode}
              onGiftModeChange={setGiftMode}
            />

            {/* Cart Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/browse")}>
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform fee (10%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isCheckingOut ? (
                    "Redirecting..."
                  ) : (
                    <>
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Secure checkout with Stripe</p>
                  <p>• Support local artisans</p>
                  <p>• 30-day return policy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Checkout Button - Fixed at bottom on small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-40">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Total ({itemCount} items):</span>
            <span className="text-2xl font-bold">${finalTotal.toFixed(2)}</span>
          </div>
          <Button 
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Checkout
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CartPage;
