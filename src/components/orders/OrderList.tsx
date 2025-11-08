import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Eye, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { PaymentStatusBadge } from "@/components/payments/PaymentComponents";

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  quantity: number;
  created_at: string;
  fulfillment_method: string;
  listing: {
    title: string;
    images: string[];
  };
  buyer_profile?: {
    display_name: string;
  };
  seller_profile?: {
    display_name: string;
  };
}

interface OrderListProps {
  type: "buyer" | "seller";
  onOrderSelect: (orderId: string) => void;
}

export const OrderList = ({ type, onOrderSelect }: OrderListProps) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        // PERFORMANCE FIX: Use PostgreSQL JSON relations to fetch profiles in one query
        // This eliminates N+1 pattern: 10 orders = 1 query instead of 21 queries (1 + 10*2)
        const query = supabase
          .from("orders")
          .select(`
            id,
            status,
            payment_status,
            total_amount,
            quantity,
            created_at,
            fulfillment_method,
            buyer_id,
            seller_id,
            listings!inner(title, images),
            buyer_profile:profiles!buyer_id(display_name),
            seller_profile:profiles!seller_id(display_name)
          `)
          .order("created_at", { ascending: false });

        if (type === "buyer") {
          query.eq("buyer_id", user.id);
        } else {
          query.eq("seller_id", user.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching orders:", error);
          return;
        }

        // No need for additional queries - profiles are already fetched!
        const ordersWithProfiles = (data || []).map((order: any) => ({
          ...order,
          listing: order.listings,
          buyer_profile: order.buyer_profile,
          seller_profile: order.seller_profile
        }));

        setOrders(ordersWithProfiles);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, type]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <Package className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "confirmed":
        return "default";
      case "completed":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No {type === "buyer" ? "purchases" : "sales"} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {order.listing?.title || "Product"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <PaymentStatusBadge status={order.payment_status as any} />
                <Badge variant={getStatusVariant(order.status) as any} className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {order.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total</span>
                <p className="font-semibold">${order.total_amount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity</span>
                <p>{order.quantity}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Method</span>
                <p className="capitalize">{order.fulfillment_method.replace("_", " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {type === "buyer" ? "Seller" : "Buyer"}
                </span>
                <p>
                  {type === "buyer" 
                    ? order.seller_profile?.display_name || "Unknown"
                    : order.buyer_profile?.display_name || "Unknown"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOrderSelect(order.id)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};