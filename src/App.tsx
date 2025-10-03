import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminProvider } from "./hooks/useAdmin";
import { CityProvider } from "./hooks/useCityContext";
import { StripeProvider } from "./hooks/useStripe";
import { CartProvider } from "./hooks/useCart";
import { PlansProvider } from "./hooks/usePlans";
import { AccessibilityProvider } from "./components/accessibility/AccessibilityProvider";
import { Suspense, lazy, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cacheManager } from "./lib/caching-strategy";
import "./styles/accessibility.css";

// Lazy load pages for better performance
const Landing = lazy(() => import("./pages/Landing"));
const NationalMarketplace = lazy(() => import("./pages/NationalMarketplace"));
const NationalBrowse = lazy(() => import("./pages/NationalBrowse"));
const City = lazy(() => import("./pages/City"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const CreateEditListing = lazy(() => import("./pages/CreateEditListing"));
const Browse = lazy(() => import("./pages/Browse"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Orders = lazy(() => import("./pages/Orders"));
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

// Configure React Query with caching optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Initialize cache manager on app startup
  useEffect(() => {
    cacheManager.initialize();
    
    // Cleanup on unmount
    return () => {
      cacheManager.cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
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
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<SellerDashboard />} />
                <Route path="/dashboard/listing/new" element={<CreateEditListing />} />
                <Route path="/dashboard/listing/:id/edit" element={<CreateEditListing />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/orders" element={<Orders />} />
                
                {/* Stripe-wrapped routes */}
                <Route path="/cart" element={<StripeProvider><Cart /></StripeProvider>} />
                <Route path="/checkout" element={<StripeProvider><Checkout /></StripeProvider>} />
                <Route path="/guest-checkout" element={<StripeProvider><GuestCheckout /></StripeProvider>} />
                <Route path="/pricing" element={<StripeProvider><Pricing /></StripeProvider>} />
                
                <Route path="/profile" element={<Profile />} />
                <Route path="/disputes" element={<Disputes />} />
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
  </QueryClientProvider>
  );
};

export default App;
