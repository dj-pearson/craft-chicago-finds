import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { OrderList } from "@/components/orders/OrderList";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { OrderReminders } from "@/components/orders/OrderReminders";
import { PostPurchaseRecommendations } from "@/components/orders/PostPurchaseRecommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [pastOrderIds, setPastOrderIds] = useState<string[]>([]);

  // Handle successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout');

    if (checkoutSuccess === 'success') {
      // Clear the cart after successful payment
      clearCart();

      // Show success message
      toast.success('Payment successful! Your order has been placed.');
      setShowSuccessBanner(true);

      // Remove the query parameter from URL
      searchParams.delete('checkout');
      searchParams.delete('guest');
      setSearchParams(searchParams, { replace: true });

      // Auto-hide banner after 10 seconds
      setTimeout(() => setShowSuccessBanner(false), 10000);
    }
  }, [searchParams, setSearchParams, clearCart]);

  // Fetch past order IDs for recommendations
  useEffect(() => {
    const fetchPastOrders = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Last 10 orders for recommendations

      if (data) {
        setPastOrderIds(data.map(o => o.id));
      }
    };

    fetchPastOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to view your orders.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your purchases and sales</p>
        </div>

        {/* Success Banner */}
        {showSuccessBanner && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Order placed successfully!</strong> Your payment has been processed and your order is being prepared by the sellers. Check your email for order confirmations.
            </AlertDescription>
          </Alert>
        )}

        <OrderReminders />

        {selectedOrderId ? (
          <OrderDetails 
            orderId={selectedOrderId} 
            onBack={() => setSelectedOrderId(null)} 
          />
        ) : (
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchases">My Purchases</TabsTrigger>
              <TabsTrigger value="sales">My Sales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="purchases" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Order List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Purchase Orders</CardTitle>
                      <CardDescription>Orders you've placed with other sellers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <OrderList
                        type="buyer"
                        onOrderSelect={setSelectedOrderId}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Buy Again Sidebar */}
                {pastOrderIds.length > 0 && (
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <RefreshCw className="h-4 w-4" />
                          Buy It Again
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Reorder your favorites
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PostPurchaseRecommendations
                          orderIds={pastOrderIds}
                          variant="buy-again"
                          limit={5}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Orders</CardTitle>
                  <CardDescription>Orders placed by customers for your products</CardDescription>
                </CardHeader>
                <CardContent>
                  <OrderList 
                    type="seller" 
                    onOrderSelect={setSelectedOrderId} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

