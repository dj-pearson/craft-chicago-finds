import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { OrderList } from "@/components/orders/OrderList";
import { OrderDetails } from "@/components/orders/OrderDetails";
import { OrderReminders } from "@/components/orders/OrderReminders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Orders() {
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

