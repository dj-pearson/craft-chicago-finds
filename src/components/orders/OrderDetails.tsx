import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, MapPin, CreditCard, Truck, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

interface OrderDetail {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  commission_amount: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  fulfillment_method: string;
  pickup_location?: string;
  tracking_number?: string;
  notes?: string;
  shipping_address?: any;
  buyer_id: string;
  seller_id: string;
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
  };
  buyer_profile: {
    display_name: string;
    email: string;
  };
  seller_profile: {
    display_name: string;
    email: string;
  };
}

export const OrderDetails = ({ orderId, onBack }: OrderDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: orderData, error } = await supabase
          .from("orders")
          .select(`
            *,
            listings!inner(id, title, description, price, images)
          `)
          .eq("id", orderId)
          .single();

        if (error || !orderData) {
          console.error("Error fetching order:", error);
          toast({
            title: "Error",
            description: "Failed to load order details",
            variant: "destructive",
          });
          return;
        }

        // Get additional profile data
        const [buyerProfile, sellerProfile] = await Promise.all([
          supabase.from("profiles").select("display_name, email").eq("user_id", orderData.buyer_id).single(),
          supabase.from("profiles").select("display_name, email").eq("user_id", orderData.seller_id).single()
        ]);

        const orderWithProfiles = {
          ...orderData,
          listing: orderData.listings,
          buyer_profile: buyerProfile.data || { display_name: "Unknown", email: "" },
          seller_profile: sellerProfile.data || { display_name: "Unknown", email: "" }
        };

        setOrder(orderWithProfiles);
        setTrackingNumber(orderWithProfiles.tracking_number || "");
        setNewStatus(orderWithProfiles.status);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, toast]);

  const updateOrder = async () => {
    if (!order || !user) return;

    setUpdating(true);
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (user.id === order.seller_id) {
        if (trackingNumber !== order.tracking_number) {
          updates.tracking_number = trackingNumber;
        }
        if (newStatus !== order.status) {
          updates.status = newStatus;
        }
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      // Refresh order data
      setOrder({ ...order, ...updates });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSeller = user?.id === order.seller_id;
  const isBuyer = user?.id === order.buyer_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge variant="secondary" className="mt-1">
                  {order.status}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Payment</Label>
                <Badge variant="outline" className="mt-1">
                  {order.payment_status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal ({order.quantity}x)</span>
                <span>${(order.total_amount - order.commission_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee</span>
                <span>${order.commission_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-muted-foreground">Created</Label>
              <p>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
            </div>

            {order.notes && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.listing.images?.[0] && (
              <img
                src={order.listing.images[0]}
                alt={order.listing.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold">{order.listing.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {order.listing.description}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="font-semibold">${order.listing.price}</span>
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {order.fulfillment_method === "shipping" ? (
                <Truck className="h-5 w-5" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Method</Label>
              <p className="capitalize">
                {order.fulfillment_method.replace("_", " ")}
              </p>
            </div>

            {order.fulfillment_method === "shipping" && (
              <>
                {order.shipping_address && (
                  <div>
                    <Label className="text-muted-foreground">Shipping Address</Label>
                    <div className="text-sm mt-1">
                      <p>{order.shipping_address.name}</p>
                      <p>{order.shipping_address.address}</p>
                      <p>
                        {order.shipping_address.city}, {order.shipping_address.state}{" "}
                        {order.shipping_address.zip}
                      </p>
                    </div>
                  </div>
                )}

                {isSeller && (
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                )}

                {order.tracking_number && !isSeller && (
                  <div>
                    <Label className="text-muted-foreground">Tracking Number</Label>
                    <p className="font-mono text-sm">{order.tracking_number}</p>
                  </div>
                )}
              </>
            )}

            {order.fulfillment_method === "local_pickup" && order.pickup_location && (
              <div>
                <Label className="text-muted-foreground">Pickup Location</Label>
                <p className="text-sm">{order.pickup_location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Buyer</Label>
              <p>{order.buyer_profile.display_name}</p>
              <p className="text-sm text-muted-foreground">
                {order.buyer_profile.email}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Seller</Label>
              <p>{order.seller_profile.display_name}</p>
              <p className="text-sm text-muted-foreground">
                {order.seller_profile.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {isSeller && (
        <Card>
          <CardHeader>
            <CardTitle>Seller Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <Button
              onClick={updateOrder}
              disabled={updating || (trackingNumber === order.tracking_number && newStatus === order.status)}
              className="w-full"
            >
              {updating ? "Updating..." : "Update Order"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};