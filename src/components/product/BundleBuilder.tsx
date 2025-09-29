import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Gift,
  Percent,
  DollarSign,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BundleItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  seller_id: string;
  seller_name: string;
  inventory_count: number;
}

interface BundleDiscount {
  id: string;
  name: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_items: number;
  max_items?: number;
}

interface BundleBuilderProps {
  currentListing?: BundleItem;
  className?: string;
}

export const BundleBuilder = ({
  currentListing,
  className = "",
}: BundleBuilderProps) => {
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [availableItems, setAvailableItems] = useState<BundleItem[]>([]);
  const [bundleDiscounts, setBundleDiscounts] = useState<BundleDiscount[]>([]);
  const [bundleName, setBundleName] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize bundle with current listing
  useEffect(() => {
    if (currentListing && isOpen) {
      setBundleItems([currentListing]);
      setBundleName(`${currentListing.title} Bundle`);
      loadAvailableItems();
      loadBundleDiscounts();
    }
  }, [currentListing, isOpen]);

  const loadAvailableItems = async () => {
    if (!currentCity) return;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          id,
          title,
          price,
          images,
          seller_id,
          inventory_count,
          seller:seller_id(display_name)
        `
        )
        .eq("city_id", currentCity.id)
        .eq("status", "active")
        .neq("id", currentListing?.id || "")
        .gt("inventory_count", 0)
        .limit(20);

      if (error) {
        console.error("Error loading available items:", error);
        return;
      }

      const formattedItems: BundleItem[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.images?.[0],
        seller_id: item.seller_id,
        seller_name: (item.seller as any)?.display_name || "Unknown Seller",
        inventory_count: item.inventory_count || 0,
      }));

      setAvailableItems(formattedItems);
    } catch (error) {
      console.error("Error loading available items:", error);
    }
  };

  const loadBundleDiscounts = async () => {
    if (!currentCity) return;

    try {
      // TODO: Implement product bundles when product_bundles table is created
      console.log('Bundle discounts functionality not yet implemented');
      setBundleDiscounts([]);
    } catch (error) {
      console.error("Error loading bundle discounts:", error);
    }
  };

  const addToBundleItems = (item: BundleItem) => {
    if (bundleItems.find((bundleItem) => bundleItem.id === item.id)) {
      toast({
        title: "Item already in bundle",
        description: "This item is already part of your bundle",
        variant: "destructive",
      });
      return;
    }

    setBundleItems((prev) => [...prev, item]);
  };

  const removeFromBundleItems = (itemId: string) => {
    setBundleItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const calculateBundleDetails = () => {
    const originalTotal = bundleItems.reduce(
      (sum, item) => sum + item.price,
      0
    );

    // Find applicable discounts
    const applicableDiscounts = bundleDiscounts.filter((discount) => {
      const itemCount = bundleItems.length;
      return (
        itemCount >= discount.min_items &&
        (!discount.max_items || itemCount <= discount.max_items)
      );
    });

    // Apply the best discount
    let bestDiscount = 0;
    let appliedDiscountName = "";

    applicableDiscounts.forEach((discount) => {
      let discountAmount = 0;
      if (discount.discount_type === "percentage") {
        discountAmount = originalTotal * (discount.discount_value / 100);
      } else {
        discountAmount = discount.discount_value;
      }

      if (discountAmount > bestDiscount) {
        bestDiscount = discountAmount;
        appliedDiscountName = discount.name;
      }
    });

    const finalTotal = Math.max(0, originalTotal - bestDiscount);
    const savingsAmount = originalTotal - finalTotal;
    const savingsPercentage =
      originalTotal > 0 ? (savingsAmount / originalTotal) * 100 : 0;

    return {
      originalTotal,
      finalTotal,
      savingsAmount,
      savingsPercentage,
      appliedDiscountName,
      itemCount: bundleItems.length,
    };
  };

  const addBundleToCart = async () => {
    if (bundleItems.length < 2) {
      toast({
        title: "Bundle too small",
        description: "A bundle must contain at least 2 items",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const bundleDetails = calculateBundleDetails();
      const cartSessionId = `cart_${user?.id || "guest"}_${Date.now()}`;

      // Save bundle to database
      // TODO: Implement bundle cart when cart_bundles table is created
        console.log('Bundle would be added to cart:', bundleItems);
        toast({
          title: "Bundle functionality coming soon!",
          description: "Multi-product bundles will be available soon.",
          duration: 3000,
        });

      // Remove bundle data reference
      for (const item of bundleItems) {
        const cartItem = {
          id: item.id,
          listing_id: item.id,
          title: item.title,
          price: item.price,
          max_quantity: item.inventory_count,
          image: item.image,
          seller_id: item.seller_id,
          seller_name: item.seller_name,
          shipping_available: true, // Assume true for bundle items
          local_pickup_available: true,
          bundle_id: null, // Remove bundle data reference
        };

        addItem(cartItem, 1);
      }

      toast({
        title: "Bundle added to cart",
        description: `${
          bundleItems.length
        } items added with ${bundleDetails.savingsPercentage.toFixed(
          0
        )}% savings!`,
      });

      // Reset and close
      setBundleItems([]);
      setBundleName("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding bundle to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add bundle to cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const bundleDetails = calculateBundleDetails();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Gift className="h-4 w-4 mr-2" />
          Build a Bundle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Build Your Gift Bundle</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
          {/* Available Items */}
          <div className="flex flex-col">
            <h3 className="font-semibold mb-3">Available Items</h3>
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {availableItems.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.seller_name}
                        </p>
                        <p className="font-semibold">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToBundleItems(item)}
                        disabled={bundleItems.some(
                          (bundleItem) => bundleItem.id === item.id
                        )}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Bundle Builder */}
          <div className="flex flex-col">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bundleName">Bundle Name</Label>
                <Input
                  id="bundleName"
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  placeholder="Enter bundle name"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-3">
                  Bundle Items ({bundleItems.length})
                </h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {bundleItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromBundleItems(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Bundle Summary */}
              {bundleItems.length >= 2 && (
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Original Total:</span>
                      <span>${bundleDetails.originalTotal.toFixed(2)}</span>
                    </div>
                    {bundleDetails.savingsAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Bundle Savings:</span>
                          <span>
                            -${bundleDetails.savingsAmount.toFixed(2)}
                          </span>
                        </div>
                        {bundleDetails.appliedDiscountName && (
                          <div className="text-xs text-muted-foreground">
                            Applied: {bundleDetails.appliedDiscountName}
                          </div>
                        )}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Bundle Total:</span>
                      <span>${bundleDetails.finalTotal.toFixed(2)}</span>
                    </div>
                    {bundleDetails.savingsPercentage > 0 && (
                      <div className="text-center">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <Percent className="h-3 w-3 mr-1" />
                          {bundleDetails.savingsPercentage.toFixed(0)}% Off
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={addBundleToCart}
                  disabled={bundleItems.length < 2 || loading}
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add Bundle to Cart
                </Button>
                {bundleItems.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Add at least 2 items to create a bundle
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
