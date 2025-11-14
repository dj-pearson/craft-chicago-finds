import { Home, Search, PlusCircle, MessageSquare, User, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";

export function BottomNav() {
  const location = useLocation();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      active: location.pathname === "/"
    },
    {
      icon: Search,
      label: "Browse",
      href: "/chicago/browse",
      active: location.pathname.includes("/browse")
    },
    {
      icon: PlusCircle,
      label: "Sell",
      href: "/seller/create-listing",
      active: location.pathname.includes("/seller")
    },
    {
      icon: MessageSquare,
      label: "Messages",
      href: "/messages",
      active: location.pathname === "/messages"
    },
    {
      icon: User,
      label: "Profile",
      href: "/profile",
      active: location.pathname === "/profile"
    }
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full rounded-md transition-colors",
                  item.active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Cart Button - Mobile Only */}
      {cartItemCount > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-20 right-4 z-50 md:hidden"
        >
          <div className="relative">
            <button className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95">
              <ShoppingCart className="h-6 w-6" />
            </button>
            <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground p-0 text-xs font-bold">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </Badge>
          </div>
        </Link>
      )}
    </>
  );
}
