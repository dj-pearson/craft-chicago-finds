import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminProvider } from "./hooks/useAdmin";
import { CityProvider } from "./hooks/useCityContext";
import { StripeProvider } from "./hooks/useStripe";
import { CartProvider } from "./hooks/useCart";
import { PlansProvider } from "./hooks/usePlans";
import { AccessibilityProvider } from "./components/accessibility/AccessibilityProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import "./styles/accessibility.css";
import "@/lib/errorHandler"; // Initialize global error handler

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

const App = () => {
  return (
    <ErrorBoundary>
        <AccessibilityProvider>
          <AuthProvider>
            <PlansProvider>
              <CartProvider>
                <AdminProvider>
                  <TooltipProvider>
                  <Toaster />
                  <Sonner />
          
            <CityProvider>
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/marketplace" element={<NationalMarketplace />} />
                <Route path="/browse" element={<NationalBrowse />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/seo" element={
                  <ProtectedRoute requireAdmin>
                    <SEODashboard />
                  </ProtectedRoute>
                } />
                
                {/* Protected Seller Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requireAuth>
                    <SellerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/orders" element={
                  <ProtectedRoute requireAuth>
                    <SellerOrders />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/listing/new" element={
                  <ProtectedRoute requireAuth>
                    <CreateEditListing />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/listing/:id/edit" element={
                  <ProtectedRoute requireAuth>
                    <CreateEditListing />
                  </ProtectedRoute>
                } />
                
                {/* Protected User Routes */}
                <Route path="/messages" element={
                  <ProtectedRoute requireAuth>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute requireAuth>
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
                  <ProtectedRoute requireAuth>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/disputes" element={
                  <ProtectedRoute requireAuth>
                    <Disputes />
                  </ProtectedRoute>
                } />
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
                <Route path="/blog" element={<Blog />} />
                <Route path="/:citySlug/blog/:slug" element={<BlogArticle />} />
                <Route path="/:city/browse" element={<Browse />} />
                <Route path="/:city/product/:id" element={<ProductDetail />} />
                <Route path="/:city" element={<City />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
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
