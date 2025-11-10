import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useDiscountCodes } from "@/hooks/useDiscountCodes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CreditCard,
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  UserX,
  Tag,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppleGooglePayButton } from "@/components/checkout/AppleGooglePayButton";
import type { AppliedDiscount } from "@/types/discount";

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export const CheckoutPage = () => {
  const { items, clearCart, totalAmount, itemCount } = useCart();
  const { user } = useAuth();
  const { validateDiscountCode, calculateDiscountAmount } = useDiscountCodes();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "mixed" | "shipping" | "local_pickup"
  >("mixed");
  const [notes, setNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // Discount code state per seller
  const [discountCodes, setDiscountCodes] = useState<Record<string, string>>({});
  const [appliedDiscounts, setAppliedDiscounts] = useState<Record<string, AppliedDiscount>>({});
  const [validatingDiscount, setValidatingDiscount] = useState<string | null>(null);

  const PLATFORM_FEE_RATE = 0.1; // 10%

  // Calculate totals with discounts
  const calculateTotals = () => {
    let subtotal = totalAmount;
    let totalDiscount = 0;

    Object.values(appliedDiscounts).forEach((discount) => {
      totalDiscount += discount.discount_amount;
    });

    const discountedSubtotal = subtotal - totalDiscount;
    const platformFee = discountedSubtotal * PLATFORM_FEE_RATE;
    const finalTotal = discountedSubtotal + platformFee;

    return { subtotal, totalDiscount, discountedSubtotal, platformFee, finalTotal };
  };

  const totals = calculateTotals();
  const { subtotal, totalDiscount, discountedSubtotal, platformFee, finalTotal } = totals;

  // Group items by seller
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

  // Check fulfillment options
  const hasShippingItems = items.some((item) => item.shipping_available);
  const hasPickupItems = items.some((item) => item.local_pickup_available);

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
      description: "The discount code has been removed from your order",
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate("/guest-checkout");
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate shipping address if needed
      if (
        fulfillmentMethod === "shipping" ||
        (fulfillmentMethod === "mixed" && hasShippingItems)
      ) {
        const requiredFields = ["name", "address", "city", "state", "zip"];
        const missingFields = requiredFields.filter(
          (field) => !shippingAddress[field as keyof ShippingAddress]
        );

        if (missingFields.length > 0) {
          toast({
            title: "Missing shipping information",
            description: "Please fill in all shipping address fields.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Create checkout session for cart
      const { data: sessionData, error } = await supabase.functions.invoke(
        "create-cart-checkout",
        {
          body: {
            cart_items: items,
            fulfillment_method: fulfillmentMethod,
            shipping_address:
              fulfillmentMethod === "shipping" || fulfillmentMethod === "mixed"
                ? shippingAddress
                : null,
            notes: notes || null,
            success_url: `${window.location.origin}/order-confirmation?checkout=success`,
            cancel_url: `${window.location.origin}/cart`,
          },
        }
      );

      if (error || !sessionData?.url) {
        throw new Error(error?.message || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      // Note: Cart will be cleared after successful payment confirmation
      window.location.href = sessionData.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    // Redirect to guest checkout instead of auth
    navigate("/guest-checkout");
    return null;
  }

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/cart")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(itemsBySeller).map(
                  ([
                    sellerId,
                    { seller_name, items: sellerItems, subtotal },
                  ]) => (
                    <div key={sellerId} className="space-y-3">
                      <div className="font-semibold text-primary">
                        From {seller_name}
                      </div>
                      {sellerItems.map((item) => (
                        <div
                          key={item.listing_id}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              ${item.price} × {item.quantity}
                            </p>
                          </div>
                          <div className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-semibold">
                        Subtotal: ${subtotal.toFixed(2)}
                      </div>

                      {/* Discount Code Input per Seller */}
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                        {appliedDiscounts[sellerId] ? (
                          <div>
                            <Alert className="bg-green-100 border-green-300">
                              <Check className="h-4 w-4 text-green-600" />
                              <AlertDescription className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold">
                                    Code "{appliedDiscounts[sellerId].code}" applied
                                  </span>
                                  <div className="text-sm">
                                    Saved ${appliedDiscounts[sellerId].discount_amount.toFixed(2)}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDiscount(sellerId)}
                                  className="h-auto p-1"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDescription>
                            </Alert>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor={`discount-${sellerId}`} className="text-sm flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Have a discount code?
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id={`discount-${sellerId}`}
                                value={discountCodes[sellerId] || ''}
                                onChange={(e) =>
                                  setDiscountCodes((prev) => ({
                                    ...prev,
                                    [sellerId]: e.target.value.toUpperCase(),
                                  }))
                                }
                                placeholder="Enter code"
                                className="uppercase"
                                disabled={validatingDiscount === sellerId}
                              />
                              <Button
                                onClick={() => handleApplyDiscount(sellerId)}
                                disabled={validatingDiscount === sellerId || !discountCodes[sellerId]}
                                size="sm"
                              >
                                {validatingDiscount === sellerId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Fulfillment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={fulfillmentMethod}
                  onValueChange={(value) => setFulfillmentMethod(value as any)}
                  className="space-y-3"
                >
                  {hasShippingItems && hasPickupItems && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label
                        htmlFor="mixed"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Truck className="h-4 w-4" />
                        Mixed (Shipping & Pickup)
                        <Badge variant="outline">
                          Best for multiple sellers
                        </Badge>
                      </Label>
                    </div>
                  )}
                  {hasShippingItems && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shipping" id="shipping" />
                      <Label
                        htmlFor="shipping"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Truck className="h-4 w-4" />
                        Shipping Only
                      </Label>
                    </div>
                  )}
                  {hasPickupItems && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="local_pickup" id="local_pickup" />
                      <Label
                        htmlFor="local_pickup"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <MapPin className="h-4 w-4" />
                        Local Pickup Only
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {(fulfillmentMethod === "shipping" ||
              fulfillmentMethod === "mixed") && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={shippingAddress.name}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="123 Main St, Apt 4B"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Chicago"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            state: e.target.value,
                          }))
                        }
                        placeholder="IL"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={shippingAddress.zip}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            zip: e.target.value,
                          }))
                        }
                        placeholder="60601"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions for the sellers..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {/* Show discount if applied */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Discount
                      </span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform fee (10%)</span>
                    <span>${platformFee.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>

                  {/* Show savings summary */}
                  {totalDiscount > 0 && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                      <p className="text-sm font-medium text-green-700">
                        🎉 You're saving ${totalDiscount.toFixed(2)}!
                      </p>
                    </div>
                  )}
                </div>

                {/* Apple Pay / Google Pay */}
                <AppleGooglePayButton
                  onSuccess={(orderId) => {
                    navigate(`/orders?order=${orderId}`);
                  }}
                  onError={(error) => {
                    console.error("Express payment error:", error);
                  }}
                  disabled={loading}
                />

                {/* Platform Disclaimer */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-xs text-blue-900">
                    <strong>Important:</strong> Your payment will be processed by Stripe.
                    {Object.keys(itemsBySeller).length > 1 ? (
                      <>
                        {' '}You have items from <strong>{Object.keys(itemsBySeller).length} different sellers</strong>,
                        so your card will be charged <strong>{Object.keys(itemsBySeller).length} separate times</strong>.
                        Each seller will ship and fulfill their portion independently.
                      </>
                    ) : (
                      <>
                        {' '}Craft Local is a marketplace platform - each seller is an independent business
                        responsible for fulfilling your order.
                      </>
                    )}
                  </p>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Continue to Payment
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => navigate("/guest-checkout")}
                    className="text-sm text-muted-foreground"
                  >
                    <UserX className="h-3 w-3 mr-1" />
                    Checkout as guest
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Secure payment processed by Stripe</p>
                  <p>• Apple Pay / Google Pay supported</p>
                  <p>• Orders split by seller automatically</p>
                  <p>• Individual tracking for each seller</p>
                  <p>• Each seller responsible for their items</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
