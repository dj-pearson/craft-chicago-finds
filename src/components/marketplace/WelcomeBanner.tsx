/**
 * Welcome Banner Component
 * Shows personalized message for authenticated users
 */

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Heart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WelcomeBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Welcome back! 👋
            </h2>
            <p className="text-muted-foreground">
              Discover unique handmade items from local artisans
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/browse')}
              className="gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/favorites')}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              Favorites
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/orders')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Orders
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
