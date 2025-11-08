/**
 * Order Confirmation Page
 * Displays order confirmation after successful checkout
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  fulfillment_method: string;
  seller: {
    display_name: string;
  };
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
}

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCleared, setCartCleared] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const checkoutSuccess = searchParams.get('checkout');

    if (checkoutSuccess !== 'success' && !sessionId) {
      // No valid confirmation parameters
      navigate('/orders');
      return;
    }

    // Clear cart only once
    if (!cartCleared) {
      clearCart();
      setCartCleared(true);
      toast.success('Payment successful! Your orders have been placed.');
    }

    fetchRecentOrders();
  }, [searchParams, navigate, clearCart, cartCleared]);

  const fetchRecentOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch orders from the last 5 minutes (recent orders from this checkout)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          fulfillment_method,
          seller:profiles!orders_seller_id_fkey(display_name),
          order_items(
            listing:listings(title, images, price),
            quantity
          )
        `)
        .eq('buyer_id', user.id)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Could not load order details');
      } else if (data) {
        // Transform data to match our interface
        const transformedOrders = data.map((order: any) => ({
          id: order.id,
          created_at: order.created_at,
          total_amount: order.total_amount,
          status: order.status,
          fulfillment_method: order.fulfillment_method,
          seller: {
            display_name: order.seller?.display_name || 'Unknown Seller'
          },
          items: order.order_items?.map((item: any) => ({
            title: item.listing?.title || 'Unknown Item',
            price: item.listing?.price || 0,
            quantity: item.quantity,
            image: item.listing?.images?.[0]
          })) || []
        }));

        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your order confirmation...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase. Your payment has been processed successfully.
            </p>
          </div>

          {/* Order Count Info */}
          {orders.length > 0 && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {orders.length === 1 ? '1 order placed' : `${orders.length} orders placed`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {orders.length === 1
                        ? 'Your order confirmation has been sent to your email.'
                        : 'Separate confirmations have been sent for each seller.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {orders.length > 0 ? (
            <div className="space-y-6 mb-8">
              {orders.map((order, index) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{index + 1} from {order.seller.display_name}
                        </CardTitle>
                        <CardDescription>
                          Order ID: {order.id.slice(0, 8)}...
                        </CardDescription>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.price} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}

                      <Separator />

                      {/* Order Total */}
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${order.total_amount.toFixed(2)}</span>
                      </div>

                      {/* Fulfillment Info */}
                      <div className="text-sm text-muted-foreground">
                        <strong>Fulfillment:</strong>{' '}
                        {order.fulfillment_method === 'shipping' && 'Shipping'}
                        {order.fulfillment_method === 'local_pickup' && 'Local Pickup'}
                        {order.fulfillment_method === 'mixed' && 'Mixed (Shipping & Pickup)'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {user
                    ? 'Your order details will appear here shortly.'
                    : 'Order details are being processed.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p>Check your email for detailed order confirmations from each seller</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p>Sellers will process your orders and send shipping/pickup details</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p>Track your orders and communicate with sellers in "My Orders"</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p>You'll receive updates as sellers ship or prepare your items</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              onClick={() => navigate('/orders')}
              className="flex-1 gap-2"
            >
              View My Orders
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate('/browse')}
              variant="outline"
              className="flex-1"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
