import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfilePanelProps {
  userId: string;
  onClose?: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_seller: boolean;
  seller_verified: boolean;
  city_id: string | null;
  created_at: string;
  last_seen_at: string | null;
  cities?: {
    id: string;
    name: string;
  };
}

interface UserStats {
  total_orders: number;
  total_spent: number;
  total_listings: number;
  total_sales: number;
  avg_rating: number;
  review_count: number;
  dispute_count: number;
  open_tickets: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface Dispute {
  id: string;
  title: string;
  status: string;
  dispute_type: string;
  created_at: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export const UserProfilePanel = ({ userId, onClose }: UserProfilePanelProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          cities:city_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load stats in parallel
      const [ordersRes, listingsRes, reviewsRes, disputesRes, ticketsRes] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('buyer_id', userId),
        supabase.from('listings').select('id').eq('seller_id', userId),
        supabase.from('reviews').select('rating').eq('reviewed_user_id', userId),
        supabase.from('disputes').select('id').or(`disputing_user_id.eq.${userId},disputed_user_id.eq.${userId}`),
        // TODO: Once support_tickets table exists, uncomment:
        // supabase.from('support_tickets').select('id').eq('user_id', userId).eq('status', 'open')
        Promise.resolve({ data: [], error: null })
      ]);

      const totalOrders = ordersRes.data?.length || 0;
      const totalSpent = ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalListings = listingsRes.data?.length || 0;
      const reviewData = reviewsRes.data || [];
      const avgRating = reviewData.length > 0
        ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
        : 0;

      setStats({
        total_orders: totalOrders,
        total_spent: totalSpent,
        total_listings: totalListings,
        total_sales: 0, // TODO: Calculate from orders where seller_id = userId
        avg_rating: avgRating,
        review_count: reviewData.length,
        dispute_count: disputesRes.data?.length || 0,
        open_tickets: ticketsRes.data?.length || 0
      });

      // Load recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setOrders(ordersData || []);

      // Load disputes
      const { data: disputesData } = await supabase
        .from('disputes')
        .select('id, title, status, dispute_type, created_at')
        .or(`disputing_user_id.eq.${userId},disputed_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(5);

      setDisputes(disputesData || []);

      // Build activity timeline
      const timeline: ActivityEvent[] = [];

      // Add orders to timeline
      ordersData?.forEach(order => {
        timeline.push({
          id: `order-${order.id}`,
          type: 'order',
          description: `Placed order - $${order.total_amount.toFixed(2)}`,
          timestamp: order.created_at,
          icon: ShoppingBag,
          color: 'text-blue-600'
        });
      });

      // Add disputes to timeline
      disputesData?.forEach(dispute => {
        timeline.push({
          id: `dispute-${dispute.id}`,
          type: 'dispute',
          description: `${dispute.status === 'open' ? 'Opened' : 'Updated'} dispute: ${dispute.title}`,
          timestamp: dispute.created_at,
          icon: AlertTriangle,
          color: 'text-orange-600'
        });
      });

      // Sort timeline by timestamp
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(timeline.slice(0, 10));

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      open: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading || !profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.display_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    User ID: {profile.user_id.slice(0, 8)}
                  </Badge>
                  {profile.is_seller && (
                    <Badge variant={profile.seller_verified ? 'default' : 'secondary'} className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {profile.seller_verified ? 'Verified Seller' : 'Seller'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.cities && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">City</p>
                  <p className="text-sm font-medium">{profile.cities.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">
                  {format(new Date(profile.created_at), 'MMM yyyy')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{stats.total_orders}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">${stats.total_spent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold">{stats.avg_rating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{stats.review_count} Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {stats.dispute_count > 0 ? (
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                )}
                <p className="text-2xl font-bold">{stats.dispute_count}</p>
                <p className="text-xs text-muted-foreground">Disputes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="disputes">Disputes</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Activity
                </h3>
                <ScrollArea className="h-64">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div key={activity.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                            <Icon className={`h-4 w-4 mt-1 ${activity.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Recent Orders
                </h3>
                <ScrollArea className="h-64">
                  {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
                  ) : (
                     <div className="space-y-2">
                      {orders.map((order) => (
                        <div key={order.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">Order #{order.id.slice(0, 8)}</span>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>${order.total_amount.toFixed(2)}</span>
                            <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="disputes" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Disputes & Claims
                </h3>
                <ScrollArea className="h-64">
                  {disputes.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-muted-foreground">No disputes</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {disputes.map((dispute) => (
                        <div key={dispute.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{dispute.title}</span>
                            <Badge className={getStatusColor(dispute.status)}>{dispute.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{dispute.dispute_type}</span>
                            <span>{format(new Date(dispute.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Full Activity Timeline
                </h3>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {activities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <div key={activity.id}>
                          <div className="flex items-start gap-3 p-2">
                            <div className="flex flex-col items-center">
                              <div className="p-2 rounded-full bg-muted">
                                <Icon className={`h-3 w-3 ${activity.color}`} />
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-8 bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <p className="text-sm">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(activity.timestamp), 'EEEE, MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};
