import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SellerActivationWizard } from "@/components/onboarding/SellerActivationWizard";
import { SellerAnalytics } from "@/components/seller/SellerAnalytics";
import { SellerPerformanceMetrics } from "@/components/seller/SellerPerformanceMetrics";
import { SellerListings } from "@/components/seller/SellerListings";
import { StripeOnboarding } from "@/components/seller/StripeOnboarding";
import { EtsyImporter } from "@/components/seller/EtsyImporter";
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
import { InventoryAlerts } from "@/components/seller/InventoryAlerts";
import { BulkOperationsDashboard } from "@/components/seller/BulkOperationsDashboard";
// IdentityVerification removed - using Stripe verification only
import { SellerComplianceGuide } from "@/components/seller/SellerComplianceGuide";
import { SellerEducationRecommendations } from "@/components/seller/SellerEducationRecommendations";
import { DiscountCodeManager } from "@/components/seller/DiscountCodeManager";
import { PayoutDashboard } from "@/components/seller/PayoutDashboard";
import { AvailableTodayPromo } from "@/components/seller/AvailableTodayPromo";
import { VacationModeManager } from "@/components/seller/VacationModeManager";
import { DemandForecast } from "@/components/seller/DemandForecast";
import { CategoryTrendAlerts } from "@/components/seller/CategoryTrendAlerts";
import { MarketModeManager } from "@/components/seller/MarketModeManager";
import { PriorityDashboard } from "@/components/seller/PriorityDashboard";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Scale,
  Shield,
  AlertTriangle,
  BookOpen,
  Tag,
  Lightbulb,
  Zap,
  Building2
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
  const [showActivationWizard, setShowActivationWizard] = useState(false);
  const [showAvailableTodayPromo, setShowAvailableTodayPromo] = useState(false);

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
        .select('is_seller, seller_verified, stripe_account_id, seller_setup_completed')
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

      // Show activation wizard for new sellers who haven't completed setup
      if (profile.is_seller && !(profile as any).seller_setup_completed) {
        setShowActivationWizard(true);
      } else if (!profile.stripe_account_id && profile.is_seller) {
        // Show Stripe onboarding if setup completed but Stripe not connected
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
        .select('id, status, view_count, price, ready_today, ships_today, pickup_today')
        .eq('seller_id', user.id);

      if (listingsError) throw listingsError;

      // Check if seller has active listings but none with "Available Today" enabled
      const activeListingsCount = listings?.filter(l => l.status === 'active').length || 0;
      const hasAvailableToday = listings?.some(l => l.ready_today || l.ships_today || l.pickup_today) || false;

      // Show promo if: has active listings, hasn't enabled Available Today, and Stripe is set up
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('user_id', user.id)
        .single();

      const hasStripe = !!profileCheck?.stripe_account_id;
      setShowAvailableTodayPromo(activeListingsCount > 0 && !hasAvailableToday && hasStripe && !localStorage.getItem("availableTodayPromoDismissed"));

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
      <main id="main-content" role="main" className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-2 sm:gap-3">
                <Package className="h-6 w-6 sm:h-8 sm:w-8" />
                Seller Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage your listings and track your business performance
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {!isSellerVerified && (
                <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                  Pending Verification
                </Badge>
              )}
              <Button
                onClick={() => navigate("/create-listing")}
                className="gap-2 w-full sm:w-auto"
                size="default"
                disabled={!(profile as any)?.stripe_account_id}
                title={!(profile as any)?.stripe_account_id ? "Connect Stripe account to create listings" : ""}
              >
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

        {/* Available Today Promo - Drive Feature Adoption */}
        {showAvailableTodayPromo && (
          <div className="mb-8">
            <AvailableTodayPromo
              onDismiss={() => setShowAvailableTodayPromo(false)}
              showDismiss={true}
            />
          </div>
        )}

        {/* Stripe Onboarding - Required */}
        {showStripeOnboarding && (
          <div className="mb-8">
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-orange-900">Payment Setup Required</CardTitle>
                    <p className="text-sm text-orange-800 mt-1">
                      You must connect your Stripe account before you can create listings or receive payments.
                      This is a one-time setup that takes about 5 minutes.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StripeOnboarding onComplete={() => window.location.reload()} />
                <p className="text-xs text-orange-700 mt-4">
                  <strong>Note:</strong> The "New Listing" button will be enabled once Stripe setup is complete.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/orders')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Manage</p>
                  <p className="text-lg font-semibold">Orders</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/messages')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p className="text-lg font-semibold">Messages</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/create-listing')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Create</p>
                  <p className="text-lg font-semibold">New Listing</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/profile')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account</p>
                  <p className="text-lg font-semibold">Settings</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
        <Tabs defaultValue="overview" className="space-y-6">
          {/* Horizontally scrollable tabs for mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-max md:w-full md:grid md:grid-cols-15 gap-1 min-w-full">
              <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <TrendingUp className="h-4 w-4 md:h-3 md:w-3" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="listings" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Package className="h-4 w-4 md:h-3 md:w-3" />
                <span>Listings</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <BarChart3 className="h-4 w-4 md:h-3 md:w-3" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="discounts" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Tag className="h-4 w-4 md:h-3 md:w-3" />
                <span>Discounts</span>
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Truck className="h-4 w-4 md:h-3 md:w-3" />
                <span>Shipping</span>
              </TabsTrigger>
              <TabsTrigger value="ready-today" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Package className="h-4 w-4 md:h-3 md:w-3" />
                <span>Ready Today</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <CreditCard className="h-4 w-4 md:h-3 md:w-3" />
                <span>Payments</span>
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <ShieldCheck className="h-4 w-4 md:h-3 md:w-3" />
                <span>Verify</span>
              </TabsTrigger>
              <TabsTrigger value="taxes" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <FileText className="h-4 w-4 md:h-3 md:w-3" />
                <span>Taxes</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Scale className="h-4 w-4 md:h-3 md:w-3" />
                <span>Standards</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <BookOpen className="h-4 w-4 md:h-3 md:w-3" />
                <span>Learn</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Shield className="h-4 w-4 md:h-3 md:w-3" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Lightbulb className="h-4 w-4 md:h-3 md:w-3" />
                <span>Forecast</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Zap className="h-4 w-4 md:h-3 md:w-3" />
                <span>Trends</span>
              </TabsTrigger>
              <TabsTrigger value="market-mode" className="flex items-center gap-1.5 text-xs whitespace-nowrap px-3 py-2">
                <Building2 className="h-4 w-4 md:h-3 md:w-3" />
                <span>Markets</span>
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Mobile scroll hint */}
          <p className="text-xs text-muted-foreground text-center md:hidden">
            Scroll tabs to see more options
          </p>

          <TabsContent value="overview">
            <div className="space-y-6">
              <PriorityDashboard />
              <VacationModeManager />
              <InventoryAlerts />
              <SellerPerformanceMetrics />
            </div>
          </TabsContent>

          <TabsContent value="listings">
            <div className="space-y-6">
              <ComplianceOverview />
              <BulkOperationsDashboard />
              <EtsyImporter />
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

          <TabsContent value="discounts">
            <DiscountCodeManager />
          </TabsContent>

          <TabsContent value="listings" className="space-y-4">
            <SellerListings />
          </TabsContent>

          <TabsContent value="shipping">
            <ShippingSettings />
          </TabsContent>

          <TabsContent value="ready-today">
            <ReadyTodaySettings sellerId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-6">
              <PayoutDashboard />
              <Card>
                <CardHeader>
                  <CardTitle>Payment Account</CardTitle>
                  <CardDescription>
                    Manage your Stripe Connect account for receiving payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StripeOnboarding />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <div className="space-y-6">
              <ComplianceAlerts />
              <div className="text-center py-8 text-muted-foreground">
                Identity verification is handled securely through Stripe during payment setup.
              </div>
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

          <TabsContent value="learn">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Learn & Improve Your Shop
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Get personalized course recommendations based on your shop's performance
                  </p>
                </CardHeader>
              </Card>
              <SellerEducationRecommendations />
            </div>
          </TabsContent>

          <TabsContent value="forecast">
            <DemandForecast sellerId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="trends">
            <CategoryTrendAlerts sellerId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="market-mode">
            <MarketModeManager sellerId={user?.id || ''} />
          </TabsContent>

        </Tabs>
      </main>
      <Footer />

      {/* Seller Activation Wizard */}
      <SellerActivationWizard
        open={showActivationWizard}
        onComplete={() => {
          setShowActivationWizard(false);
          checkSellerStatus();
          fetchSellerStats();
        }}
      />
    </div>
  );
}