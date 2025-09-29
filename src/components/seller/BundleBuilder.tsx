import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Trash2,
  Search,
  DollarSign,
  Percent,
  ShoppingCart,
  GripVertical,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  inventory_count: number;
  status: string;
}

interface BundleItem {
  id: string;
  listing_id: string;
  listing: Listing;
  quantity: number;
  sort_order: number;
}

interface Bundle {
  id?: string;
  title: string;
  description: string;
  bundle_price: number;
  discount_amount: number;
  discount_percentage: number;
  is_active: boolean;
  items: BundleItem[];
}

interface BundleBuilderProps {
  bundleId?: string;
  onSave?: (bundle: Bundle) => void;
  onCancel?: () => void;
}

export const BundleBuilder = ({
  bundleId,
  onSave,
  onCancel,
}: BundleBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bundle, setBundle] = useState<Bundle>({
    title: "",
    description: "",
    bundle_price: 0,
    discount_amount: 0,
    discount_percentage: 0,
    is_active: true,
    items: [],
  });

  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  useEffect(() => {
    if (bundleId) {
      loadBundle();
    }
    loadAvailableListings();
  }, [bundleId]);

  useEffect(() => {
    calculatePricing();
  }, [bundle.items, bundle.discount_amount, bundle.discount_percentage]);

  const loadBundle = async () => {
    if (!bundleId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("product_bundles")
        .select(
          `
          *,
          bundle_items (
            *,
            listings (*)
          )
        `
        )
        .eq("id", bundleId)
        .eq("seller_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setBundle({
          id: data.id,
          title: data.title,
          description: data.description || "",
          bundle_price: data.bundle_price,
          discount_amount: data.discount_amount || 0,
          discount_percentage: data.discount_percentage || 0,
          is_active: data.is_active,
          items: data.bundle_items.map((item: any) => ({
            id: item.id,
            listing_id: item.listing_id,
            listing: item.listings,
            quantity: item.quantity,
            sort_order: item.sort_order,
          })),
        });
      }
    } catch (error: any) {
      console.error("Error loading bundle:", error);
      toast({
        title: "Error loading bundle",
        description: error.message || "Failed to load bundle data.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableListings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images, inventory_count, status")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAvailableListings(data || []);
    } catch (error: any) {
      console.error("Error loading listings:", error);
    }
  };

  const calculatePricing = () => {
    const totalPrice = bundle.items.reduce(
      (sum, item) => sum + item.listing.price * item.quantity,
      0
    );

    let finalPrice = totalPrice;

    if (bundle.discount_percentage > 0) {
      finalPrice = totalPrice * (1 - bundle.discount_percentage / 100);
      setBundle((prev) => ({
        ...prev,
        bundle_price: finalPrice,
        discount_amount: totalPrice - finalPrice,
      }));
    } else if (bundle.discount_amount > 0) {
      finalPrice = Math.max(0, totalPrice - bundle.discount_amount);
      setBundle((prev) => ({
        ...prev,
        bundle_price: finalPrice,
        discount_percentage:
          totalPrice > 0 ? ((totalPrice - finalPrice) / totalPrice) * 100 : 0,
      }));
    } else {
      setBundle((prev) => ({ ...prev, bundle_price: totalPrice }));
    }
  };

  const addItemToBundle = (listing: Listing, quantity: number = 1) => {
    const existingItem = bundle.items.find(
      (item) => item.listing_id === listing.id
    );

    if (existingItem) {
      setBundle((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.listing_id === listing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      }));
    } else {
      const newItem: BundleItem = {
        id: `temp_${Date.now()}`,
        listing_id: listing.id,
        listing,
        quantity,
        sort_order: bundle.items.length,
      };

      setBundle((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }

    setShowAddItemDialog(false);
    toast({
      title: "Item added",
      description: `${listing.title} added to bundle`,
      duration: 2000,
    });
  };

  const removeItemFromBundle = (itemId: string) => {
    setBundle((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItemFromBundle(itemId);
      return;
    }

    setBundle((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(bundle.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort order
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setBundle((prev) => ({ ...prev, items: updatedItems }));
  };

  const validateBundle = (): string[] => {
    const errors = [];

    if (!bundle.title.trim()) {
      errors.push("Bundle title is required");
    }

    if (bundle.items.length < 2) {
      errors.push("Bundle must contain at least 2 items");
    }

    if (bundle.bundle_price <= 0) {
      errors.push("Bundle price must be greater than 0");
    }

    // Check inventory availability
    for (const item of bundle.items) {
      if (item.quantity > item.listing.inventory_count) {
        errors.push(
          `Not enough inventory for ${item.listing.title} (requested: ${item.quantity}, available: ${item.listing.inventory_count})`
        );
      }
    }

    return errors;
  };

  const saveBundle = async () => {
    const errors = validateBundle();
    if (errors.length > 0) {
      toast({
        title: "Validation errors",
        description: errors.join(", "),
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      const bundleData = {
        seller_id: user.id,
        title: bundle.title,
        description: bundle.description,
        bundle_price: bundle.bundle_price,
        discount_amount: bundle.discount_amount,
        discount_percentage: bundle.discount_percentage,
        is_active: bundle.is_active,
      };

      let savedBundle;

      if (bundle.id) {
        // Update existing bundle
        const { data, error } = await supabase
          .from("product_bundles")
          .update(bundleData)
          .eq("id", bundle.id)
          .eq("seller_id", user.id)
          .select()
          .single();

        if (error) throw error;
        savedBundle = data;

        // Delete existing bundle items
        await supabase.from("bundle_items").delete().eq("bundle_id", bundle.id);
      } else {
        // Create new bundle
        const { data, error } = await supabase
          .from("product_bundles")
          .insert(bundleData)
          .select()
          .single();

        if (error) throw error;
        savedBundle = data;
      }

      // Insert bundle items
      const bundleItems = bundle.items.map((item) => ({
        bundle_id: savedBundle.id,
        listing_id: item.listing_id,
        quantity: item.quantity,
        sort_order: item.sort_order,
      }));

      const { error: itemsError } = await supabase
        .from("bundle_items")
        .insert(bundleItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Bundle saved",
        description: `${bundle.title} has been saved successfully.`,
        duration: 3000,
      });

      if (onSave) {
        onSave({ ...bundle, id: savedBundle.id });
      }
    } catch (error: any) {
      console.error("Error saving bundle:", error);
      toast({
        title: "Error saving bundle",
        description:
          error.message || "Failed to save bundle. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredListings = availableListings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !bundle.items.some((item) => item.listing_id === listing.id)
  );

  const totalOriginalPrice = bundle.items.reduce(
    (sum, item) => sum + item.listing.price * item.quantity,
    0
  );

  const savings = totalOriginalPrice - bundle.bundle_price;
  const savingsPercentage =
    totalOriginalPrice > 0 ? (savings / totalOriginalPrice) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p>Loading bundle...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bundle Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Bundle Title *</Label>
              <Input
                id="title"
                value={bundle.title}
                onChange={(e) =>
                  setBundle((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Starter Pottery Kit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={bundle.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setBundle((prev) => ({
                    ...prev,
                    is_active: value === "active",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={bundle.description}
              onChange={(e) =>
                setBundle((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what's included in this bundle and why it's a great deal..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bundle Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bundle Items ({bundle.items.length})</CardTitle>
            <Dialog
              open={showAddItemDialog}
              onOpenChange={setShowAddItemDialog}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Item to Bundle</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search your listings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {listing.images[0] && (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{listing.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${listing.price} • {listing.inventory_count} in
                              stock
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => addItemToBundle(listing)}
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    ))}

                    {filteredListings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No listings found matching your search"
                          : "No available listings to add"}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {bundle.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items in bundle yet</p>
              <p className="text-sm">Add at least 2 items to create a bundle</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="bundle-items">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {bundle.items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-background"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {item.listing.images[0] && (
                              <img
                                src={item.listing.images[0]}
                                alt={item.listing.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}

                            <div className="flex-1">
                              <h4 className="font-medium">
                                {item.listing.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                ${item.listing.price} each
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                max={item.listing.inventory_count}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItemQuantity(
                                    item.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-20"
                              />
                            </div>

                            <div className="text-right">
                              <p className="font-medium">
                                $
                                {(item.listing.price * item.quantity).toFixed(
                                  2
                                )}
                              </p>
                            </div>

                            <Button
                              onClick={() => removeItemFromBundle(item.id)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      {bundle.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Bundle Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount-amount">Discount Amount ($)</Label>
                <Input
                  id="discount-amount"
                  type="number"
                  min="0"
                  max={totalOriginalPrice}
                  step="0.01"
                  value={bundle.discount_amount}
                  onChange={(e) =>
                    setBundle((prev) => ({
                      ...prev,
                      discount_amount: parseFloat(e.target.value) || 0,
                      discount_percentage: 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-percentage">
                  Discount Percentage (%)
                </Label>
                <Input
                  id="discount-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={bundle.discount_percentage}
                  onChange={(e) =>
                    setBundle((prev) => ({
                      ...prev,
                      discount_percentage: parseFloat(e.target.value) || 0,
                      discount_amount: 0,
                    }))
                  }
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Original Total:</span>
                <span>${totalOriginalPrice.toFixed(2)}</span>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Savings:</span>
                  <span>
                    -${savings.toFixed(2)} ({savingsPercentage.toFixed(1)}%)
                  </span>
                </div>
              )}

              <div className="flex justify-between text-lg font-semibold">
                <span>Bundle Price:</span>
                <span>${bundle.bundle_price.toFixed(2)}</span>
              </div>
            </div>

            {savingsPercentage > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Great deal! Customers save {savingsPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {validateBundle().length > 0 ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>{validateBundle().length} validation error(s)</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Ready to save</span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={saveBundle}
            disabled={saving || validateBundle().length > 0}
            className="gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Save Bundle
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
