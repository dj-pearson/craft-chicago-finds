import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminProvider } from "./hooks/useAdmin";
import { CityProvider } from "./hooks/useCityContext";
import { StripeProvider } from "./hooks/useStripe";
import { CartProvider } from "./hooks/useCart";
import { PlansProvider } from "./hooks/usePlans";
import { SecurityProvider } from "./hooks/useSecurityContext";
import { AccessibilityProvider } from "./components/accessibility/AccessibilityProvider";
import { SkipLinks } from "./components/accessibility/SkipLinks";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BottomNav } from "./components/mobile";
import { Suspense, lazy, useCallback } from "react";
import { PageLoadingSkeleton } from "@/components/ui/skeleton-loader";
import "./styles/accessibility.css";
import "@/lib/errorHandler"; // Initialize global error handler
import { SessionTimeoutWarning } from "@/components/auth/SessionTimeoutWarning";
import { RoleLevel } from "@/lib/security/permissions";

// Lazy load all pages for optimal code splitting
const Landing = lazy(() => import("./pages/Landing"));
const NationalMarketplace = lazy(() => import("./pages/NationalMarketplace"));
const NationalBrowse = lazy(() => import("./pages/NationalBrowse"));
const City = lazy(() => import("./pages/City"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/SellerOrders"));
const CreateEditListing = lazy(() => import("./pages/CreateEditListing"));
const Browse = lazy(() => import("./pages/Browse"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const GuestCheckout = lazy(() => import("./components/checkout/GuestCheckout"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Profile = lazy(() => import("./pages/Profile"));
const Disputes = lazy(() => import("./pages/Disputes"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const DMCA = lazy(() => import("./pages/DMCA"));
const ProhibitedItems = lazy(() => import("./pages/ProhibitedItems"));
const FeeSchedule = lazy(() => import("./pages/FeeSchedule"));
const FoodSafetyGuidelines = lazy(() => import("./pages/FoodSafetyGuidelines"));
const SellerStandards = lazy(() => import("./pages/SellerStandards"));
const DMCANotice = lazy(() => import("./pages/DMCANotice"));
const DisputeResolutionGuide = lazy(() => import("./pages/DisputeResolutionGuide"));
const SafetyGuidelines = lazy(() => import("./pages/SafetyGuidelines"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const W9Submission = lazy(() => import("./pages/W9Submission"));
const FeaturedMakers = lazy(() => import("./pages/FeaturedMakers"));
const SEODashboard = lazy(() => import("./pages/SEODashboard"));
const PricingCalculator = lazy(() => import("./pages/PricingCalculator"));
const ChicagoCraftIndex = lazy(() => import("./pages/ChicagoCraftIndex"));
const ForCraftFairs = lazy(() => import("./pages/ForCraftFairs"));
const About = lazy(() => import("./pages/About"));
const Sell = lazy(() => import("./pages/Sell"));
const Accessibility = lazy(() => import("./pages/Accessibility"));

/**
 * Security callbacks for handling access denials
 */
const SecurityCallbacksWrapper = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleAuthRequired = useCallback(() => {
    // Navigation will be handled by ProtectedRoute
  }, []);

  const handlePermissionDenied = useCallback(() => {
    // Navigation will be handled by ProtectedRoute
  }, [navigate]);

  const handleOwnershipDenied = useCallback(() => {
    // Navigation will be handled by ProtectedRoute
  }, [navigate]);

  return (
    <SecurityProvider
      onAuthRequired={handleAuthRequired}
      onPermissionDenied={handlePermissionDenied}
      onOwnershipDenied={handleOwnershipDenied}
    >
      {children}
    </SecurityProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
        <AccessibilityProvider>
          <SkipLinks />
          <AuthProvider>
            <PlansProvider>
              <CartProvider>
                <AdminProvider>
                  <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <SessionTimeoutWarning />

            <CityProvider>
              <Suspense fallback={<PageLoadingSkeleton />}>
              <SecurityCallbacksWrapper>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/marketplace" element={<NationalMarketplace />} />
                <Route path="/browse" element={<NationalBrowse />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />

                {/* Protected Admin Routes - Layer 2: Admin role required */}
                <Route path="/admin" element={
                  <ProtectedRoute
                    requireAdmin
                    requireRoleLevel={RoleLevel.ADMIN}
                    requirePermission="admin.dashboard"
                  >
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/seo" element={
                  <ProtectedRoute
                    requireAdmin
                    requireRoleLevel={RoleLevel.ADMIN}
                    requirePermission="admin.dashboard"
                  >
                    <SEODashboard />
                  </ProtectedRoute>
                } />

                {/* Protected Seller Routes - Layer 2: Seller permissions */}
                <Route path="/dashboard" element={
                  <ProtectedRoute
                    requireAuth
                    requireSeller
                    requirePermission="seller.dashboard"
                  >
                    <SellerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/orders" element={
                  <ProtectedRoute
                    requireAuth
                    requireSeller
                    requireAnyPermission={["orders.own.view", "orders.all.view"]}
                  >
                    <SellerOrders />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/listing/new" element={
                  <ProtectedRoute
                    requireAuth
                    requireSeller
                    requirePermission="listings.create"
                  >
                    <CreateEditListing />
                  </ProtectedRoute>
                } />
                {/* Layer 3: Ownership verification for editing listings */}
                <Route path="/dashboard/listing/:id/edit" element={
                  <ProtectedRoute
                    requireAuth
                    requireSeller
                    requirePermission="listings.own.edit"
                    resourceType="listing"
                    resourceIdParam="id"
                  >
                    <CreateEditListing />
                  </ProtectedRoute>
                } />

                {/* Protected User Routes - Layer 2: User permissions */}
                <Route path="/messages" element={
                  <ProtectedRoute
                    requireAuth
                    requirePermission="messages.own.view"
                  >
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute
                    requireAuth
                    requirePermission="orders.own.view"
                  >
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />

                {/* Stripe-wrapped routes */}
                <Route path="/cart" element={<StripeProvider><Cart /></StripeProvider>} />
                <Route path="/checkout" element={<StripeProvider><Checkout /></StripeProvider>} />
                <Route path="/guest-checkout" element={<StripeProvider><GuestCheckout /></StripeProvider>} />
                <Route path="/pricing" element={<StripeProvider><Pricing /></StripeProvider>} />

                <Route path="/profile" element={
                  <ProtectedRoute
                    requireAuth
                    requirePermission="profile.own.view"
                  >
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/disputes" element={
                  <ProtectedRoute
                    requireAuth
                    requirePermission="disputes.own.view"
                  >
                    <Disputes />
                  </ProtectedRoute>
                } />

                {/* Public routes - no authentication required */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/dmca" element={<DMCA />} />
                <Route path="/prohibited-items" element={<ProhibitedItems />} />
                <Route path="/fee-schedule" element={<FeeSchedule />} />
                <Route path="/food-safety" element={<FoodSafetyGuidelines />} />
                <Route path="/seller-standards" element={<SellerStandards />} />
                <Route path="/dmca-notice" element={<DMCANotice />} />
                <Route path="/dispute-resolution" element={<DisputeResolutionGuide />} />
                <Route path="/safety-guidelines" element={<SafetyGuidelines />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/w9-submission" element={<W9Submission />} />
                <Route path="/featured-makers" element={<FeaturedMakers />} />
                <Route path="/tools/pricing-calculator" element={<PricingCalculator />} />
                <Route path="/chicago-craft-index" element={<ChicagoCraftIndex />} />
                <Route path="/for-craft-fairs" element={<ForCraftFairs />} />
                <Route path="/about" element={<About />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/:citySlug/blog/:slug" element={<BlogArticle />} />
                <Route path="/:city/browse" element={<Browse />} />
                <Route path="/:city/product/:id" element={<ProductDetail />} />
                <Route path="/:city" element={<City />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </SecurityCallbacksWrapper>
              <BottomNav />
              </Suspense>
            </CityProvider>

              </TooltipProvider>
            </AdminProvider>
          </CartProvider>
        </PlansProvider>
      </AuthProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
};

export default App;
