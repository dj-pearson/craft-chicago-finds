import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
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

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo & City Selector */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs sm:text-sm">CM</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg xl:text-xl font-bold text-foreground">Chicago Makers</h1>
                <p className="text-xs text-muted-foreground -mt-1">Local Handmade Marketplace</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <CitySelector />
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xl xl:max-w-2xl mx-6 xl:mx-8">
            <QuickSearch className="w-full" />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Browse
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Sell
            </a>
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              About
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Search - Mobile */}
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 sm:h-10 sm:w-10">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Notifications */}
            {user && <NotificationCenter />}

            {/* Cart */}
            <CartIndicator showLabel={false} />

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.display_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {profile?.is_seller && (
                      <Badge variant="secondary" className="text-xs mt-1">Seller</Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  {profile?.is_seller && (
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Seller Dashboard
                    </DropdownMenuItem>
                   )}
                   <DropdownMenuItem onClick={() => navigate("/messages")}>
                     <MessageCircle className="mr-2 h-4 w-4" />
                     Messages
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate("/orders")}>
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
                className="text-xs sm:text-sm px-3 sm:px-4"
              >
                <span className="hidden sm:inline">Sign In</span>
                <span className="sm:hidden">Sign In</span>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
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
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                Browse Categories
              </a>
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                Start Selling
              </a>
              <a href="#" className="flex items-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors py-3 px-3 rounded-lg text-base font-medium">
                About Chicago Makers
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