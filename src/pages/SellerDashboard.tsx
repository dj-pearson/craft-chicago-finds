import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SellerAnalytics } from "@/components/seller/SellerAnalytics";
import { SellerListings } from "@/components/seller/SellerListings";
import { StripeOnboarding } from "@/components/seller/StripeOnboarding";
import { ShippingSettings } from "@/components/seller/ShippingSettings";
import { ReadyTodaySettings } from "@/components/seller/ReadyTodaySettings";
import { SellerVerification } from "@/components/seller/SellerVerification";
import { W9FormSubmission } from "@/components/seller/W9FormSubmission";
import { TaxDocuments } from "@/components/seller/TaxDocuments";
import { PerformanceMetrics } from "@/components/seller/PerformanceMetrics";
import { PublicDisclosure } from "@/components/seller/PublicDisclosure";
import { ComplianceOverview } from "@/components/seller/ComplianceOverview";
import { ComplianceNotifications } from "@/components/seller/ComplianceNotifications";
import { PerformanceScore } from "@/components/seller/PerformanceScore";
import { ComplianceAlerts } from "@/components/seller/ComplianceAlerts";
import { ImprovementPlan } from "@/components/seller/ImprovementPlan";
import { ComplianceStatus } from "@/components/seller/ComplianceStatus";
import { IdentityVerification } from "@/components/seller/IdentityVerification";
import { SellerComplianceGuide } from "@/components/seller/SellerComplianceGuide";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Package, 
  TrendingUp, 
  MessageSquare, 
  DollarSign,
  Eye,
  ShoppingCart,
  Star,
  BarChart3,
  CreditCard,
  Truck,
  ShieldCheck,
  FileText,
  Scale
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SellerStats {
  total_listings: number;
  active_listings: number;
  total_views: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  messages_count: number;
  average_rating: number;
}

export default function SellerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isSellerVerified, setIsSellerVerified] = useState(false);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkSellerStatus();
      fetchSellerStats();
    }

    // Check if returning from Stripe onboarding
    const onboardingStatus = searchParams.get('onboarding');
    if (onboardingStatus === 'complete') {
      toast({
        title: "Payment setup complete!",
        description: "Your Stripe account has been connected successfully.",
      });
    }
  }, [user, authLoading, navigate, searchParams]);

  const checkSellerStatus = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_seller, seller_verified, stripe_account_id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!profile?.is_seller) {
        toast({
          title: "Seller account required",
          description: "Please enable seller mode in your profile settings.",
          variant: "destructive"
        });
        navigate("/profile");
        return;
      }

      setIsSellerVerified(profile.seller_verified || false);
      
      // Check if payment setup is needed
      if (!profile.stripe_account_id && profile.is_seller) {
        setShowStripeOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
      toast({
        title: "Error",
        description: "Failed to verify seller status.",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSellerStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get listing stats
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, status, view_count, price')
        .eq('seller_id', user.id);

      if (listingsError) throw listingsError;

      // Get order stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total_amount')
        .eq('seller_id', user.id);

      if (ordersError) throw ordersError;

      // Get message stats
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', user.id);

      if (messagesError) throw messagesError;

      // Get review stats
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', user.id)
        .eq('review_type', 'seller');

      if (reviewsError) throw reviewsError;

      const totalListings = listings?.length || 0;
      const activeListings = listings?.filter(l => l.status === 'active').length || 0;
      const totalViews = listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(String(o.total_amount || '0')), 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const messagesCount = messages?.length || 0;
      const averageRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      setStats({
        total_listings: totalListings,
        active_listings: activeListings,
        total_views: totalViews,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders,
        messages_count: messagesCount,
        average_rating: averageRating
      });

    } catch (error) {
      console.error('Error fetching seller stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Package className="h-8 w-8" />
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your listings and track your business performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isSellerVerified && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Pending Verification
                </Badge>
              )}
              <Button onClick={() => navigate("/create-listing")} className="gap-2">
                <Plus className="h-4 w-4" />
                New Listing
              </Button>
            </div>
          </div>
        </div>

        {/* Compliance Notifications */}
        <div className="mb-8">
          <ComplianceNotifications />
        </div>

        {/* Stripe Onboarding Modal */}
        {showStripeOnboarding && (
          <div className="mb-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Complete Your Payment Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  To start selling and receiving payments, you need to set up your Stripe account.
                </p>
                <StripeOnboarding onComplete={() => setShowStripeOnboarding(false)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded mb-2"></div>
                    <div className="h-6 bg-muted rounded mb-1"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_listings}</p>
                    <p className="text-sm text-muted-foreground">Total Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.active_listings}</p>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Eye className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_views.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total_orders}</p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.pending_orders}</p>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.messages_count}</p>
                    <p className="text-sm text-muted-foreground">Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Main Content */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
            <TabsTrigger value="listings" className="flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              <span className="hidden sm:inline">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-1 text-xs">
              <Truck className="h-3 w-3" />
              <span className="hidden sm:inline">Shipping</span>
            </TabsTrigger>
            <TabsTrigger value="ready-today" className="flex items-center gap-1 text-xs">
              <Package className="h-3 w-3" />
              <span className="hidden sm:inline">Ready</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 text-xs">
              <CreditCard className="h-3 w-3" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-1 text-xs">
              <ShieldCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Taxes</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-1 text-xs">
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">Standards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div className="space-y-6">
              <ComplianceOverview />
              <SellerListings />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <ComplianceStatus />
              <ImprovementPlan />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceScore />
                <ComplianceAlerts />
              </div>
              <SellerAnalytics />
            </div>
          </TabsContent>

          
          <TabsContent value="shipping">
            <ShippingSettings />
          </TabsContent>

          <TabsContent value="ready-today">
            <ReadyTodaySettings sellerId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="payments">
            <StripeOnboarding />
          </TabsContent>

          <TabsContent value="verification">
            <div className="space-y-6">
              <ComplianceAlerts />
              <IdentityVerification />
              <SellerVerification />
              <PublicDisclosure />
            </div>
          </TabsContent>

          <TabsContent value="taxes">
            <div className="space-y-6">
              <W9FormSubmission />
              <TaxDocuments />
            </div>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="space-y-6">
              <SellerComplianceGuide />
              <PerformanceMetrics />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}