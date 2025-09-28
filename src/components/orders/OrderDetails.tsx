import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Package, 
  MapPin, 
  Truck, 
  MessageCircle, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Order } from "@/pages/Orders";
import type { User } from "@supabase/supabase-js";

interface OrderDetailsProps {
  orderId: string | null;
  orders: Order[];
  currentUser: User;
  onUpdateOrder: (order: Order) => void;
}

export const OrderDetails = ({ orderId, orders, currentUser, onUpdateOrder }: OrderDetailsProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const order = orders.find(o => o.id === orderId);

  const handleContactSeller = () => {
    navigate("/messages");
    toast({
      title: "Messaging feature",
      description: "Redirected to messages. The conversation would be opened here.",
    });
  };

  const handleTrackPackage = () => {
    if (order?.tracking_number) {
      window.open(`https://www.ups.com/track?tracknum=${order.tracking_number}`, '_blank');
    }
  };

  const handleReorderItem = () => {
    toast({
      title: "Feature coming soon",
      description: "Reorder functionality will be available soon.",
    });
  };

  const handleMarkAsReceived = async () => {
    if (!order) return;
    
    setLoading(true);
    try {
      // TODO: Implement order status update in Supabase
      const updatedOrder = { ...order, status: "completed" as const };
      onUpdateOrder(updatedOrder);
      
      toast({
        title: "Order marked as received",
        description: "Thank you for confirming delivery!",
      });
    } catch (error) {
      toast({
        title: "Error updating order",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveReview = () => {
    toast({
      title: "Feature coming soon",
      description: "Review functionality will be available soon.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "in_transit":
        return <Truck className="h-5 w-5 text-primary" />;
      case "delivered":
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Waiting for seller confirmation";
      case "confirmed":
        return "Order confirmed by seller";
      case "in_transit":
        return "Package is on its way";
      case "delivered":
        return "Package delivered";
      case "completed":
        return "Order completed";
      case "cancelled":
        return "Order cancelled";
      default:
        return "Unknown status";
    }
  };

  if (!order) {
    return (
      <Card className="h-fit">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select an order</h3>
          <p className="text-muted-foreground text-center">
            Choose an order from the list to view its details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge
              variant={order.status === "completed" ? "default" : "secondary"}
              className={order.status === "completed" ? "bg-success text-success-foreground" : ""}
            >
              {order.status.toUpperCase().replace("_", " ")}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {getStatusText(order.status)}
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <div className="text-sm">
                <span className="font-medium">Order placed</span>
                <div className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {order.status !== "pending" && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <div className="text-sm">
                  <span className="font-medium">Order confirmed</span>
                </div>
              </div>
            )}

            {["in_transit", "delivered", "completed"].includes(order.status) && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <div className="text-sm">
                  <span className="font-medium">
                    {order.fulfillment_method === "shipping" ? "Package shipped" : "Ready for pickup"}
                  </span>
                </div>
              </div>
            )}

            {["delivered", "completed"].includes(order.status) && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <div className="text-sm">
                  <span className="font-medium">
                    {order.fulfillment_method === "shipping" ? "Package delivered" : "Item picked up"}
                  </span>
                  <div className="text-muted-foreground">
                    {new Date(order.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {order.tracking_number && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleTrackPackage}
              >
                <ExternalLink className="h-4 w-4" />
                Track Package
              </Button>
            )}
            
            {order.status === "delivered" && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleMarkAsReceived}
                disabled={loading}
              >
                Mark as Received
              </Button>
            )}

            {order.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleLeaveReview}
              >
                <Star className="h-4 w-4" />
                Leave Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              {order.listing.images?.[0] ? (
                <img
                  src={order.listing.images[0]}
                  alt={order.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-1">
                {order.listing.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Quantity: {order.quantity}
              </p>
              <p className="text-sm text-muted-foreground">
                Price: ${order.listing.price} each
              </p>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${(order.total_amount - order.commission_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Service fee</span>
              <span>${order.commission_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Fulfillment Details */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {order.fulfillment_method === "shipping" ? (
                <>
                  <Truck className="h-4 w-4" />
                  Shipping Details
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Pickup Details
                </>
              )}
            </h4>
            
            {order.fulfillment_method === "shipping" ? (
              <div className="text-sm text-muted-foreground">
                {order.tracking_number && (
                  <p>Tracking: {order.tracking_number}</p>
                )}
                <p>Estimated delivery: 3-5 business days</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Pickup location: {order.pickup_location}</p>
                <p>Coordinate pickup with seller</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seller Info */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={order.seller.avatar_url || ""} />
              <AvatarFallback>
                {order.seller.display_name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {order.seller.display_name || "Anonymous Seller"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Local artisan
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleContactSeller}
            >
              <MessageCircle className="h-4 w-4" />
              Message Seller
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleReorderItem}
            >
              Reorder Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};