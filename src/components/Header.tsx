import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X, LogOut, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CitySelector } from "@/components/CitySelector";
import { NotificationCenter } from "@/components/notifications";
import { CartIndicator } from "@/components/cart/CartIndicator";
import { QuickSearch } from "@/components/browse/QuickSearch";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const location = useLocation();

  // Determine which logo to show based on current page
  const isChicagoPage = location.pathname.includes('/chicago') || location.pathname === '/cities/chicago';
  const logoSrcWebP = isChicagoPage ? '/Chicago.webp' : '/Logo.webp';
  const logoSrcFallback = isChicagoPage ? '/Chicago.png' : '/Logo.png';
  const logoAlt = isChicagoPage ? 'CraftLocal Chicago' : 'CraftLocal';
  const logoWidth = isChicagoPage ? 300 : 300;
  const logoHeight = isChicagoPage ? 191 : 103;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              className="flex items-center cursor-pointer bg-transparent border-none p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              onClick={() => navigate("/")}
              aria-label="Go to homepage"
            >
              <picture>
                <source srcSet={logoSrcWebP} type="image/webp" />
                <img
                  src={logoSrcFallback}
                  alt={logoAlt}
                  className="h-7 sm:h-8 object-contain"
                  width={logoWidth}
                  height={logoHeight}
                  fetchPriority="high"
                  decoding="async"
                />
              </picture>
            </button>
            <div className="hidden md:block">
              <CitySelector />
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-4">
            <QuickSearch className="w-full" />
          </div>

          {/* Navigation - Desktop */}
          <nav id="main-navigation" className="hidden lg:flex items-center gap-1 flex-shrink-0" aria-label="Main navigation">
            <Button
              variant="ghost"
              className={`h-9 px-3 text-sm font-medium transition-colors ${
                location.pathname === "/marketplace"
                  ? "text-primary bg-primary/10"
                  : "hover:text-primary"
              }`}
              onClick={() => navigate("/marketplace")}
              aria-current={location.pathname === "/marketplace" ? "page" : undefined}
            >
              Marketplace
            </Button>
            <Button
              variant="ghost"
              className={`h-9 px-3 text-sm font-medium transition-colors ${
                location.pathname === "/browse" || location.pathname.startsWith("/browse/")
                  ? "text-primary bg-primary/10"
                  : "hover:text-primary"
              }`}
              onClick={() => navigate("/browse")}
              aria-current={location.pathname === "/browse" || location.pathname.startsWith("/browse/") ? "page" : undefined}
            >
              Browse
            </Button>
            <Button
              variant="ghost"
              className={`h-9 px-3 text-sm font-medium transition-colors ${
                location.pathname === "/sell"
                  ? "text-primary bg-primary/10"
                  : "hover:text-primary"
              }`}
              onClick={() => navigate("/sell")}
              aria-current={location.pathname === "/sell" ? "page" : undefined}
            >
              Sell
            </Button>
            <Button
              variant="ghost"
              className={`h-9 px-3 text-sm font-medium transition-colors ${
                location.pathname === "/pricing"
                  ? "text-primary bg-primary/10"
                  : "hover:text-primary"
              }`}
              onClick={() => navigate("/pricing")}
              aria-current={location.pathname === "/pricing" ? "page" : undefined}
            >
              Pricing
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {/* Search - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isMenuOpen) setIsMenuOpen(false);
              }}
              aria-label={isSearchOpen ? "Close search" : "Open search"}
              aria-expanded={isSearchOpen}
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Accessibility - Desktop only */}
            <div className="hidden sm:flex h-9 items-center">
              <AccessibilityPanel />
            </div>

            {/* Notifications - Logged in users only */}
            {user && (
              <div className="h-9 flex items-center">
                <NotificationCenter />
              </div>
            )}

            {/* Cart */}
            <div className="h-9 flex items-center">
              <CartIndicator showLabel={false} />
            </div>

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover z-[60]">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{profile?.display_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {profile?.is_seller && (
                      <Badge variant="secondary" className="text-xs mt-1">Seller</Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {profile?.is_seller && (
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Seller Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/messages")}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate("/auth")}
                className="h-9 px-3 sm:px-4 text-sm font-medium"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 ml-1 flex-shrink-0"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                if (isSearchOpen) setIsSearchOpen(false);
              }}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Panel */}
        {isSearchOpen && (
          <div className="lg:hidden py-3 border-t border-border animate-fade-in">
            <QuickSearch className="w-full" compact />
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-3 border-t border-border animate-fade-in">
            {/* City Selector - Mobile */}
            <div className="mb-3 sm:hidden">
              <CitySelector />
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-0.5" aria-label="Mobile navigation">
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors py-2.5 px-3 rounded-md text-sm font-medium h-auto ${
                  location.pathname === "/marketplace"
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted/50"
                }`}
                onClick={() => {
                  navigate("/marketplace");
                  setIsMenuOpen(false);
                }}
                aria-current={location.pathname === "/marketplace" ? "page" : undefined}
              >
                National Marketplace
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors py-2.5 px-3 rounded-md text-sm font-medium h-auto ${
                  location.pathname === "/browse" || location.pathname.startsWith("/browse/")
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted/50"
                }`}
                onClick={() => {
                  navigate("/browse");
                  setIsMenuOpen(false);
                }}
                aria-current={location.pathname === "/browse" || location.pathname.startsWith("/browse/") ? "page" : undefined}
              >
                Browse Categories
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors py-2.5 px-3 rounded-md text-sm font-medium h-auto ${
                  location.pathname === "/sell"
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted/50"
                }`}
                onClick={() => {
                  navigate("/sell");
                  setIsMenuOpen(false);
                }}
                aria-current={location.pathname === "/sell" ? "page" : undefined}
              >
                Start Selling
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-colors py-2.5 px-3 rounded-md text-sm font-medium h-auto ${
                  location.pathname === "/pricing"
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:text-primary hover:bg-muted/50"
                }`}
                onClick={() => {
                  navigate("/pricing");
                  setIsMenuOpen(false);
                }}
                aria-current={location.pathname === "/pricing" ? "page" : undefined}
              >
                Pricing
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};