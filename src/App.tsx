import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminProvider } from "./hooks/useAdmin";
import { CityProvider } from "./hooks/useCityContext";
import { StripeProvider } from "./hooks/useStripe";
import { CartProvider } from "./hooks/useCart";
import { PlansProvider } from "./hooks/usePlans";
import Landing from "./pages/Landing";
import City from "./pages/City";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import CreateEditListing from "./pages/CreateEditListing";
import Browse from "./pages/Browse";
import ProductDetail from "./pages/ProductDetail";
import Messages from "./pages/Messages";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Disputes from "./pages/Disputes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StripeProvider>
      <AuthProvider>
        <PlansProvider>
          <CartProvider>
            <AdminProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
          <BrowserRouter>
            <CityProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/dashboard" element={<SellerDashboard />} />
                <Route path="/dashboard/listing/new" element={<CreateEditListing />} />
                <Route path="/dashboard/listing/:id/edit" element={<CreateEditListing />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/disputes" element={<Disputes />} />
                <Route path="/:city/browse" element={<Browse />} />
                <Route path="/:city/product/:id" element={<ProductDetail />} />
                <Route path="/:city" element={<City />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CityProvider>
          </BrowserRouter>
              </TooltipProvider>
            </AdminProvider>
          </CartProvider>
        </PlansProvider>
      </AuthProvider>
    </StripeProvider>
  </QueryClientProvider>
);

export default App;
