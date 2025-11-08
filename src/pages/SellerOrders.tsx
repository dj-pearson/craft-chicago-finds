/**
 * Seller Order Management Page
 * Allows sellers to view, manage, and fulfill orders
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  MessageCircle,
  Printer,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  fulfillment_method: string;
  tracking_number: string | null;
  shipping_address: any;
  notes: string | null;
  buyer: {
    id: string;
    display_name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    listing: {
      id: string;
      title: string;
      images: string[];
    };
  }>;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
};

export default function SellerOrders() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!user || !profile?.is_seller) {
      navigate('/auth');
      return;
    }

    fetchOrders();
  }, [user, profile, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          fulfillment_method,
          tracking_number,
          shipping_address,
          notes,
          buyer:profiles!orders_buyer_id_fkey(
            user_id,
            display_name,
            email
          ),
          order_items(
            id,
            quantity,
            price,
            listing:listings(
              id,
              title,
              images
            )
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        return;
      }

      // Transform data to match interface
      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        created_at: order.created_at,
        total_amount: order.total_amount,
        status: order.status,
        fulfillment_method: order.fulfillment_method,
        tracking_number: order.tracking_number,
        shipping_address: order.shipping_address,
        notes: order.notes,
        buyer: {
          id: order.buyer?.user_id || '',
          display_name: order.buyer?.display_name || 'Unknown',
          email: order.buyer?.email || '',
        },
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          listing: {
            id: item.listing?.id || '',
            title: item.listing?.title || 'Unknown Item',
            images: item.listing?.images || [],
          },
        })) || [],
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .eq('seller_id', user!.id);

      if (error) throw error;

      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addTrackingNumber = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber.trim(),
          status: 'shipped',
        })
        .eq('id', selectedOrder.id)
        .eq('seller_id', user!.id);

      if (error) throw error;

      toast.success('Tracking number added and order marked as shipped');
      setTrackingDialogOpen(false);
      setTrackingNumber('');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error adding tracking:', error);
      toast.error('Failed to add tracking number');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders =
    selectedStatus === 'all'
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">Manage and fulfill your customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(orderCounts).map(([status, count]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const Icon = config?.icon || Package;
            return (
              <Card
                key={status}
                className={`cursor-pointer transition-colors ${
                  selectedStatus === status ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedStatus(status)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {status === 'all' ? 'Total' : status}
                      </p>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {selectedStatus === 'all'
                  ? "You haven't received any orders yet."
                  : `No ${selectedStatus} orders at the moment.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = config?.icon || Package;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(order.created_at), 'PPP p')} • {order.buyer.display_name}
                        </CardDescription>
                      </div>
                      <Badge className={config?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            {item.listing.images[0] ? (
                              <img
                                src={item.listing.images[0]}
                                alt={item.listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.listing.title}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.price} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Total Amount</p>
                        <p className="text-2xl font-bold">${order.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Fulfillment</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {order.fulfillment_method?.replace('_', ' ')}
                        </p>
                      </div>
                      {order.tracking_number && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium mb-1">Tracking Number</p>
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block">
                            {order.tracking_number}
                          </p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium mb-1">Customer Notes</p>
                          <p className="text-sm text-muted-foreground">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          disabled={updatingStatus}
                        >
                          Mark as Processing
                        </Button>
                      )}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Mark as Shipped
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Tracking Information</DialogTitle>
                              <DialogDescription>
                                Enter the tracking number for this shipment. The customer will be
                                notified via email.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label htmlFor="tracking">Tracking Number</Label>
                                <Input
                                  id="tracking"
                                  value={trackingNumber}
                                  onChange={(e) => setTrackingNumber(e.target.value)}
                                  placeholder="e.g., 1Z999AA10123456784"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={addTrackingNumber} disabled={updatingStatus} className="flex-1">
                                  {updatingStatus ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Adding...
                                    </>
                                  ) : (
                                    'Add Tracking & Ship'
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setTrackingDialogOpen(false);
                                    setTrackingNumber('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {order.status === 'shipped' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          disabled={updatingStatus}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Delivered
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/messages?buyer=${order.buyer.id}`)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Buyer
                      </Button>
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              updateOrderStatus(order.id, 'cancelled');
                            }
                          }}
                          disabled={updatingStatus}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
