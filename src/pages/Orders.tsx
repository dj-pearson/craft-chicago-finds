import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderList } from "@/components/orders/OrderList";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  quantity: number;
  total_amount: number;
  commission_amount: number;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  fulfillment_method: 'pickup' | 'shipping';
  pickup_location?: string;
  shipping_address?: any;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    price: number;
  };
  seller: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  buyer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    // TODO: Implement order fetching from Supabase
    // For now, using mock data
    const mockOrders: Order[] = [
      {
        id: "order-1",
        buyer_id: user?.id || "",
        seller_id: "seller-1",
        listing_id: "listing-1",
        quantity: 1,
        total_amount: 45.00,
        commission_amount: 4.50,
        status: "delivered",
        payment_status: "paid",
        fulfillment_method: "pickup",
        pickup_location: "Lincoln Park Studio",
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        listing: {
          id: "listing-1",
          title: "Handmade Ceramic Vase",
          images: ["/api/placeholder/200/200"],
          price: 45.00,
        },
        seller: {
          id: "seller-1",
          display_name: "Sarah Chen",
          avatar_url: null,
        },
        buyer: {
          id: user?.id || "",
          display_name: "You",
          avatar_url: null,
        },
      },
      {
        id: "order-2",
        buyer_id: user?.id || "",
        seller_id: "seller-2",
        listing_id: "listing-2",
        quantity: 2,
        total_amount: 60.00,
        commission_amount: 6.00,
        status: "in_transit",
        payment_status: "paid",
        fulfillment_method: "shipping",
        tracking_number: "1Z999AA1234567890",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        listing: {
          id: "listing-2",
          title: "Handcrafted Wooden Cutting Board",
          images: ["/api/placeholder/200/200"],
          price: 30.00,
        },
        seller: {
          id: "seller-2",
          display_name: "Marcus Rodriguez",
          avatar_url: null,
        },
        buyer: {
          id: user?.id || "",
          display_name: "You",
          avatar_url: null,
        },
      },
    ];
    
    setOrders(mockOrders);
    setLoading(false);
  };

  const filterOrders = (status: string) => {
    if (status === "all") return orders;
    return orders.filter(order => order.status === status);
  };

  const getTabIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTabCount = (status: string) => {
    return filterOrders(status).length;
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Package className="h-8 w-8" />
            My Orders
          </h1>
          <p className="text-muted-foreground">
            Track your purchases and order history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order List with Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="gap-2">
                  {getTabIcon("all")}
                  All ({getTabCount("all")})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  {getTabIcon("pending")}
                  Pending ({getTabCount("pending")})
                </TabsTrigger>
                <TabsTrigger value="delivered" className="gap-2">
                  {getTabIcon("completed")}
                  Completed ({getTabCount("delivered")})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="gap-2">
                  {getTabIcon("cancelled")}
                  Cancelled ({getTabCount("cancelled")})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <OrderList
                  orders={filterOrders(activeTab)}
                  selectedOrder={selectedOrder}
                  onSelectOrder={setSelectedOrder}
                  currentUser={user}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <OrderDetails
              orderId={selectedOrder}
              orders={orders}
              currentUser={user}
              onUpdateOrder={(updatedOrder) => {
                setOrders(prev => prev.map(order => 
                  order.id === updatedOrder.id ? updatedOrder : order
                ));
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;