import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useDiscountCodes } from "@/hooks/useDiscountCodes";
import { usePlatformFee } from "@/hooks/usePlatformFee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Loader2, Info, Tag, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GiftModeToggle } from "@/components/cart/GiftModeToggle";
import { SubtleSignupPrompt } from "@/components/auth/SubtleSignupPrompt";
import { useToast } from "@/hooks/use-toast";
import type { AppliedDiscount } from "@/types/discount";

export const CartPage = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    itemCount,
  } = useCart();
  const { user } = useAuth();
  const { validateDiscountCode, calculateDiscountAmount } = useDiscountCodes();
  const { feeRate, flatFee } = usePlatformFee();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [giftMode, setGiftMode] = useState({
    enabled: false,
    message: "",
    recipientEmail: "",
    scheduledShipDate: "",
    hidePrices: false,
  });

  // Discount code state per seller
  const [discountCodes, setDiscountCodes] = useState<Record<string, string>>({});
  const [appliedDiscounts, setAppliedDiscounts] = useState<Record<string, AppliedDiscount>>({});
  const [validatingDiscount, setValidatingDiscount] = useState<string | null>(null);

  // Calculate totals with discounts
  const calculateTotals = () => {
    const subtotal = totalAmount;
    let totalDiscount = 0;

    Object.values(appliedDiscounts).forEach((discount) => {
      totalDiscount += discount.discount_amount;
    });

    const discountedSubtotal = subtotal - totalDiscount;
    const platformFee = (discountedSubtotal * feeRate) + flatFee;
    const finalTotal = discountedSubtotal + platformFee;

    return { subtotal, totalDiscount, discountedSubtotal, platformFee, finalTotal };
  };

  const totals = calculateTotals();
  const { subtotal, totalDiscount, discountedSubtotal, platformFee, finalTotal } = totals;

  // Group items by seller for better organization
  const itemsBySeller = items.reduce((acc, item) => {
    if (!acc[item.seller_id]) {
      acc[item.seller_id] = {
        seller_name: item.seller_name,
        items: [],
        subtotal: 0,
      };
    }
    acc[item.seller_id].items.push(item);
    acc[item.seller_id].subtotal += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { seller_name: string; items: typeof items; subtotal: number }>);

  // Apply discount code
  const handleApplyDiscount = async (sellerId: string) => {
    const code = discountCodes[sellerId]?.trim();
    if (!code) {
      toast({
        title: "Error",
        description: "Please enter a discount code",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use discount codes",
        variant: "destructive",
      });
      return;
    }

    setValidatingDiscount(sellerId);
    try {
      const sellerSubtotal = itemsBySeller[sellerId].subtotal;

      // Validate the discount code
      const validation = await validateDiscountCode(code, sellerId, sellerSubtotal);

      if (!validation.valid) {
        toast({
          title: "Invalid code",
          description: validation.error || "This discount code is not valid",
          variant: "destructive",
        });
        return;
      }

      // Calculate discount amount
      const discountAmount = await calculateDiscountAmount(
        validation.discount_type!,
        validation.discount_value!,
        sellerSubtotal,
        validation.maximum_discount_amount
      );

      // Apply the discount
      setAppliedDiscounts((prev) => ({
        ...prev,
        [sellerId]: {
          code,
          discount_code_id: validation.discount_code_id!,
          discount_type: validation.discount_type!,
          discount_amount: discountAmount,
          original_total: sellerSubtotal,
          final_total: sellerSubtotal - discountAmount,
        },
      }));

      toast({
        title: "Discount applied!",
        description: `You saved $${discountAmount.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error applying discount:", error);
      toast({
        title: "Error",
        description: "Failed to apply discount code",
        variant: "destructive",
      });
    } finally {
      setValidatingDiscount(null);
    }
  };

  // Remove applied discount
  const handleRemoveDiscount = (sellerId: string) => {
    setAppliedDiscounts((prev) => {
      const updated = { ...prev };
      delete updated[sellerId];
      return updated;
    });
    setDiscountCodes((prev) => {
      const updated = { ...prev };
      delete updated[sellerId];
      return updated;
    });
    toast({
      title: "Discount removed",
      description: "The discount code has been removed",
    });
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    navigate("/checkout", { state: { giftMode, appliedDiscounts } });
  };

  const handleRemoveItem = (listingId: string) => {
    setItemToDelete(listingId);
  };

  const confirmRemoveItem = () => {
    if (itemToDelete) {
      removeItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const confirmClearCart = () => {
    clearCart();
    setShowClearCartDialog(false);
  };

  if (items.length === 0) {
    return (
      <main id="main-content" role="main" tabIndex={-1} className="container mx-auto px-4 py-8 focus:outline-none">
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
      </main>
    );
  }

  return (
    <main id="main-content" role="main" tabIndex={-1} className="container mx-auto px-4 py-8 focus:outline-none">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Badge>
        </div>

        {/* Subtle signup prompt for anonymous users */}
        <SubtleSignupPrompt variant="cart" className="mb-6" />

        {/* Multi-Seller Warning */}
        {Object.keys(itemsBySeller).length > 1 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Multiple Sellers in Your Cart</strong>
              <p className="mt-1 text-sm">
                Your cart contains items from {Object.keys(itemsBySeller).length} different sellers.
                This will create {Object.keys(itemsBySeller).length} separate orders, and your card will be charged
                {Object.keys(itemsBySeller).length} times. Each seller ships independently.
              </p>
            </AlertDescription>
          </Alert>
        )}

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
                            aria-label="Decrease quantity"
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
                            aria-label={`Quantity for ${item.title}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.listing_id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.max_quantity}
                            aria-label="Increase quantity"
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
                            onClick={() => handleRemoveItem(item.listing_id)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Remove ${item.title} from cart`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Discount Code Section */}
                    <div className="mt-4 pt-4 border-t">
                      {appliedDiscounts[sellerId] ? (
                        // Show applied discount
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-semibold text-green-900">
                                Code "{appliedDiscounts[sellerId].code}" applied
                              </p>
                              <p className="text-xs text-green-700">
                                You saved ${appliedDiscounts[sellerId].discount_amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveDiscount(sellerId)}
                            className="text-green-700 hover:text-green-900"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        // Show discount code input
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Have a discount code?</span>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter code"
                              value={discountCodes[sellerId] || ""}
                              onChange={(e) =>
                                setDiscountCodes((prev) => ({
                                  ...prev,
                                  [sellerId]: e.target.value.toUpperCase(),
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleApplyDiscount(sellerId);
                                }
                              }}
                              disabled={validatingDiscount === sellerId}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => handleApplyDiscount(sellerId)}
                              disabled={
                                validatingDiscount === sellerId ||
                                !discountCodes[sellerId]?.trim()
                              }
                              size="sm"
                            >
                              {validatingDiscount === sellerId ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Applying...
                                </>
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          </div>
                          {!user && (
                            <p className="text-xs text-muted-foreground">
                              Sign in to use discount codes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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
                onClick={() => setShowClearCartDialog(true)}
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
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>Discount</span>
                        </div>
                        <span>-${totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Discounted subtotal</span>
                        <span>${discountedSubtotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>Platform fee ({(feeRate * 100).toFixed(1)}%{flatFee > 0 && ` + $${flatFee.toFixed(2)}`})</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Supports platform maintenance, payment processing, seller tools, and customer support.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg" aria-live="polite" aria-atomic="true">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="text-xs text-green-600 font-medium text-right">
                      You're saving ${totalDiscount.toFixed(2)}!
                    </div>
                  )}
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

      {/* Remove Item Confirmation Dialog */}
      <AlertDialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item from cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear entire cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all {itemCount} item{itemCount !== 1 ? 's' : ''} from your cart? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default CartPage;
