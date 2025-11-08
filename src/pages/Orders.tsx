import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { OrderList } from "@/components/orders/OrderList";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { OrderReminders } from "@/components/orders/OrderReminders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

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

