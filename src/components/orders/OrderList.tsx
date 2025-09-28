import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package, MapPin, Truck, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Order } from "@/pages/Orders";
import type { User } from "@supabase/supabase-js";

interface OrderListProps {
  orders: Order[];
  selectedOrder: string | null;
  onSelectOrder: (id: string) => void;
  currentUser: User;
}

export const OrderList = ({ orders, selectedOrder, onSelectOrder, currentUser }: OrderListProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case "in_transit":
        return <Truck className="h-4 w-4 text-primary" />;
      case "delivered":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === "refunded") {
      return <Badge variant="destructive">Refunded</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "confirmed":
        return <Badge variant="outline">Confirmed</Badge>;
      case "in_transit":
        return <Badge className="bg-primary">In Transit</Badge>;
      case "delivered":
      case "completed":
        return <Badge variant="default" className="bg-success text-success-foreground">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground text-center">
            You haven't placed any orders yet. Start browsing to find unique handmade items!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-elevated border-border/50 hover:border-primary/20 ${
            selectedOrder === order.id ? 'ring-2 ring-primary border-primary' : ''
          }`}
          onClick={() => onSelectOrder(order.id)}
        >
          <CardContent className="p-6">
            {/* Order Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(order.status)}
                <div>
                  <div className="font-semibold text-foreground">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              {getStatusBadge(order.status, order.payment_status)}
            </div>

            {/* Product Info */}
            <div className="flex items-center gap-4 mb-4">
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={order.seller.avatar_url || ""} />
                    <AvatarFallback className="text-xs">
                      {order.seller.display_name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <span>by {order.seller.display_name || "Anonymous Seller"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Quantity: {order.quantity} × ${order.listing.price}
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-lg text-foreground">
                  ${order.total_amount}
                </div>
                {order.fulfillment_method === "shipping" ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Truck className="h-3 w-3" />
                    <span>Shipping</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>Pickup</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {order.tracking_number && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Tracking:</span> {order.tracking_number}
              </div>
            )}

            {/* Quick Actions Preview */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>
                Updated {new Date(order.updated_at).toLocaleDateString()}
              </span>
              <span className="text-primary cursor-pointer hover:underline">
                View Details →
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};