/**
 * Quick Actions Component
 * Shows relevant actions based on authentication status
 */

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  UserPlus, 
  LogIn, 
  ShoppingBag, 
  Heart, 
  Package,
  Store,
  ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Join as a Founding Seller
              </h2>
              <p className="text-muted-foreground">
                Sign up now to be part of our Chicago marketplace launch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-primary/20">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Become a Seller
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    List your handmade crafts and reach customers in Chicago and nationally. Free to join, low commission.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    size="lg" 
                    className="w-full gap-2"
                  >
                    Sign Up to Sell
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <LogIn className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Already Signed Up?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Welcome back! Sign in to manage your shop, add products, and get ready for launch.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    variant="outline" 
                    size="lg" 
                    className="w-full gap-2"
                  >
                    Seller Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>

            <div className="mt-8 p-6 bg-accent/10 rounded-lg border border-accent/20">
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">
                  🎨 Calling All Chicago Crafters
                </h3>
                <p className="text-sm text-muted-foreground">
                  We're looking for talented artisans making jewelry, pottery, candles, art, home decor, and more. 
                  Join now to launch with us and be featured as a founding seller.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // For authenticated users
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              What Would You Like to Do?
            </h2>
            <p className="text-muted-foreground">
              Explore upcoming features and manage your account
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Browse</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Coming soon
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                className="w-full"
              >
                Coming Soon
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Favorites</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Coming soon
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                className="w-full"
              >
                Coming Soon
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Orders</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Coming soon
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/orders')}
                className="w-full"
              >
                View Orders
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                <Store className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Sell</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Coming soon
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                className="w-full"
              >
                Coming Soon
              </Button>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  🎉 You're All Set!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your account is ready. Marketplace features (browsing, cart, checkout) are launching soon. 
                  We'll notify you when they're available!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
