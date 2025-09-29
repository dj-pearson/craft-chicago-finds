import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RotateCcw, 
  ShoppingCart,
  Clock,
  Package,
  Star,
  Plus,
  Minus,
  Calendar,
  Zap,
  Heart,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface PreviousOrder {
  id: string;
  order_date: string;
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[];
    seller_name: string;
    is_consumable: boolean;
    estimated_usage_days?: number;
  };
  quantity: number;
  total_price: number;
  status: 'delivered' | 'shipped' | 'processing';
  is_reorderable: boolean;
  suggested_reorder_date?: string;
  days_since_order: number;
}

interface ReorderSubscription {
  id: string;
  listing_id: string;
  frequency_days: number;
  quantity: number;
  next_order_date: string;
  is_active: boolean;
}

interface OneClickReorderProps {
  userId?: string;
  className?: string;
}

export const OneClickReorder = ({ userId, className }: OneClickReorderProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [previousOrders, setPreviousOrders] = useState<PreviousOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<ReorderSubscription[]>([]);
  const [reordering, setReordering] = useState<string | null>(null);
  const [settingUpSubscription, setSettingUpSubscription] = useState<string | null>(null);
  
  const [subscriptionForm, setSubscriptionForm] = useState({
    listing_id: '',
    frequency_days: 30,
    quantity: 1
  });

  const currentUserId = userId || user?.id;

  useEffect(() => {
    if (currentUserId) {
      fetchReorderableItems();
      fetchSubscriptions();
    }
  }, [currentUserId]);

  const fetchReorderableItems = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      // In production, this would fetch actual order history
      const mockOrders = generateMockOrders(currentUserId);
      setPreviousOrders(mockOrders);
    } catch (error) {
      console.error("Error fetching reorderable items:", error);
      toast({
        title: "Error",
        description: "Failed to load previous orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!currentUserId) return;

    try {
      // Mock subscription data
      const mockSubscriptions: ReorderSubscription[] = [
        {
          id: 'sub-1',
          listing_id: 'listing-1',
          frequency_days: 30,
          quantity: 2,
          next_order_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        }
      ];
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const generateMockOrders = (userId: string): PreviousOrder[] => {
    const consumableItems = [
      {
        id: 'listing-1',
        title: 'Lavender Soy Candle',
        price: 28,
        images: ['https://images.unsplash.com/photo-1602874801007-19c9ff8e3b5d?w=400'],
        seller_name: 'Chicago Candle Co.',
        is_consumable: true,
        estimated_usage_days: 45
      },
      {
        id: 'listing-2',
        title: 'Organic Chamomile Tea Blend',
        price: 18,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
        seller_name: 'Windy City Herbs',
        is_consumable: true,
        estimated_usage_days: 21
      },
      {
        id: 'listing-3',
        title: 'Handmade Goat Milk Soap',
        price: 12,
        images: ['https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400'],
        seller_name: 'Prairie Soap Works',
        is_consumable: true,
        estimated_usage_days: 30
      },
      {
        id: 'listing-4',
        title: 'Artisan Coffee Beans - Medium Roast',
        price: 22,
        images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'],
        seller_name: 'Logan Square Roasters',
        is_consumable: true,
        estimated_usage_days: 14
      }
    ];

    return consumableItems.map((item, index) => {
      const orderDate = new Date(Date.now() - (index + 1) * 20 * 24 * 60 * 60 * 1000);
      const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      const estimatedUsageDays = item.estimated_usage_days || 30;
      const suggestedReorderDate = new Date(orderDate.getTime() + estimatedUsageDays * 24 * 60 * 60 * 1000);
      
      return {
        id: `order-${index + 1}`,
        order_date: orderDate.toISOString(),
        listing: item,
        quantity: Math.floor(Math.random() * 3) + 1,
        total_price: item.price * (Math.floor(Math.random() * 3) + 1),
        status: 'delivered' as const,
        is_reorderable: true,
        suggested_reorder_date: suggestedReorderDate.toISOString(),
        days_since_order: daysSinceOrder
      };
    });
  };

  const handleReorder = async (order: PreviousOrder) => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to reorder items",
        variant: "destructive",
      });
      return;
    }

    setReordering(order.id);
    try {
      // Add to cart with the same quantity as before
      await addToCart(order.listing.id, order.quantity);
      
      toast({
        title: "Added to cart!",
        description: `${order.listing.title} (${order.quantity}x) added to your cart`,
      });
    } catch (error) {
      console.error("Error reordering:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setReordering(null);
    }
  };

  const setupSubscription = async (listingId: string) => {
    if (!currentUserId) return;

    setSettingUpSubscription(listingId);
    try {
      const subscription: ReorderSubscription = {
        id: `sub-${Date.now()}`,
        listing_id: listingId,
        frequency_days: subscriptionForm.frequency_days,
        quantity: subscriptionForm.quantity,
        next_order_date: new Date(Date.now() + subscriptionForm.frequency_days * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };

      // In production, save to database
      setSubscriptions(prev => [...prev, subscription]);

      toast({
        title: "Subscription created!",
        description: `You'll automatically reorder every ${subscriptionForm.frequency_days} days`,
      });

      setSubscriptionForm({
        listing_id: '',
        frequency_days: 30,
        quantity: 1
      });
    } catch (error) {
      console.error("Error setting up subscription:", error);
      toast({
        title: "Error",
        description: "Failed to set up subscription",
        variant: "destructive",
      });
    } finally {
      setSettingUpSubscription(null);
    }
  };

  const getReorderUrgency = (order: PreviousOrder): 'overdue' | 'due' | 'upcoming' | 'recent' => {
    if (!order.suggested_reorder_date) return 'recent';
    
    const suggestedDate = new Date(order.suggested_reorder_date);
    const now = new Date();
    const daysUntilReorder = Math.floor((suggestedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilReorder < -7) return 'overdue';
    if (daysUntilReorder <= 0) return 'due';
    if (daysUntilReorder <= 7) return 'upcoming';
    return 'recent';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'due':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'upcoming':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyMessage = (order: PreviousOrder) => {
    const urgency = getReorderUrgency(order);
    const estimatedDays = order.listing.estimated_usage_days || 30;
    
    switch (urgency) {
      case 'overdue':
        return `Time to reorder! You ordered this ${order.days_since_order} days ago`;
      case 'due':
        return `Ready to reorder - typical usage is ${estimatedDays} days`;
      case 'upcoming':
        return `Consider reordering soon`;
      default:
        return `Ordered ${order.days_since_order} days ago`;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your reorder history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reorderableItems = previousOrders.filter(order => order.is_reorderable);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-primary" />
          One-Click Reorder
        </CardTitle>
        <CardDescription>
          Quickly reorder your favorite consumables like candles, soaps, and teas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {reorderableItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No reorderable items yet</h3>
            <p className="text-sm text-muted-foreground">
              Order some consumables like candles, soaps, or teas to see them here for easy reordering
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Ready to Reorder</h3>
              <Badge variant="outline" className="px-3 py-1">
                {reorderableItems.length} items
              </Badge>
            </div>

            {reorderableItems.map((order) => {
              const urgency = getReorderUrgency(order);
              const hasSubscription = subscriptions.some(sub => 
                sub.listing_id === order.listing.id && sub.is_active
              );
              
              return (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <OptimizedImage
                        src={order.listing.images[0]}
                        alt={order.listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium truncate">{order.listing.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            by {order.listing.seller_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.listing.price}</div>
                          {order.quantity > 1 && (
                            <div className="text-xs text-muted-foreground">
                              Last ordered: {order.quantity}x
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Urgency Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getUrgencyColor(urgency)}`}
                        >
                          {urgency === 'overdue' && <Clock className="h-3 w-3 mr-1" />}
                          {urgency === 'due' && <Zap className="h-3 w-3 mr-1" />}
                          {urgency === 'upcoming' && <Calendar className="h-3 w-3 mr-1" />}
                          {getUrgencyMessage(order)}
                        </Badge>
                        {hasSubscription && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Auto-reorder active
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReorder(order)}
                          disabled={reordering === order.id}
                          className="flex-1"
                        >
                          {reordering === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-3 w-3 mr-2" />
                              Reorder Now
                            </>
                          )}
                        </Button>
                        
                        {!hasSubscription && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSubscriptionForm(prev => ({
                                ...prev,
                                listing_id: order.listing.id,
                                quantity: order.quantity
                              }));
                              setupSubscription(order.listing.id);
                            }}
                            disabled={settingUpSubscription === order.listing.id}
                          >
                            {settingUpSubscription === order.listing.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Auto-Reorder Subscriptions
            </h3>
            
            {subscriptions.map((subscription) => {
              const listing = previousOrders.find(order => 
                order.listing.id === subscription.listing_id
              )?.listing;
              
              if (!listing) return null;
              
              return (
                <Card key={subscription.id} className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                        <OptimizedImage
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Every {subscription.frequency_days} days • Quantity: {subscription.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Next: {new Date(subscription.next_order_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>Reorder tips:</strong></p>
          <p>• We track typical usage patterns for consumables</p>
          <p>• Set up auto-reorder to never run out of favorites</p>
          <p>• Reorder suggestions based on your purchase history</p>
          <p>• Cancel or modify subscriptions anytime</p>
        </div>
      </CardContent>
    </Card>
  );
};
