import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X, LogOut, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which logo to show based on current page
  const isChicagoPage = location.pathname.includes('/chicago') || location.pathname === '/cities/chicago';
  const logoSrc = isChicagoPage ? '/Chicago.png' : '/Logo.png';
  const logoAlt = isChicagoPage ? 'CraftLocal Chicago' : 'CraftLocal';

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & City Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
              <img 
                src={logoSrc} 
                alt={logoAlt} 
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="hidden md:block">
              <CitySelector />
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <QuickSearch className="w-full" />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                className="h-10 px-4 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => navigate("/marketplace")}
              >
                National Marketplace
              </Button>
              <Button 
                variant="ghost" 
                className="h-10 px-4 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => navigate("/browse")}
              >
                Browse
              </Button>
              <Button 
                variant="ghost" 
                className="h-10 px-4 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => navigate("/sell")}
              >
                Sell
              </Button>
              <Button 
                variant="ghost" 
                className="h-10 px-4 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => navigate("/about")}
              >
                About
              </Button>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search - Mobile */}
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Accessibility */}
            <div className="h-10 flex items-center">
              <AccessibilityPanel />
            </div>

            {/* Notifications */}
            {user && (
              <div className="h-10 flex items-center">
                <NotificationCenter />
              </div>
            )}

            {/* Cart */}
            <div className="h-10 flex items-center">
              <CartIndicator showLabel={false} />
            </div>

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuItem onClick={signOut}>
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
                className="h-10 px-4 text-sm font-medium"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-10 w-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 px-1 border-t border-border animate-fade-in">
            {/* City Selector - Mobile */}
            <div className="mb-4 sm:hidden">
              <CitySelector />
            </div>

            {/* Mobile Search */}
            <div className="relative mb-6">
              <QuickSearch className="w-full" compact />
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium h-auto"
                onClick={() => {
                  navigate("/marketplace");
                  setIsMenuOpen(false);
                }}
              >
                🌎 National Marketplace
              </Button>
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                Browse Categories
              </a>
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                Start Selling
              </a>
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                About Craft Local
              </a>
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                Help & Support
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};