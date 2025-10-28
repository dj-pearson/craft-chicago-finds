/**
 * Marketplace Status Component
 * Shows current implementation status and coming soon features
 */

import { Check, Clock, ShoppingBag, Heart, Package, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeatureStatus {
  name: string;
  status: 'live' | 'coming-soon';
  icon: React.ReactNode;
  description: string;
}

const features: FeatureStatus[] = [
  {
    name: 'User Accounts',
    status: 'live',
    icon: <Check className="h-5 w-5" />,
    description: 'Sign up, sign in, and manage your profile',
  },
  {
    name: 'Product Browsing',
    status: 'coming-soon',
    icon: <ShoppingBag className="h-5 w-5" />,
    description: 'Browse handmade products from local artisans',
  },
  {
    name: 'Shopping Cart',
    status: 'coming-soon',
    icon: <Package className="h-5 w-5" />,
    description: 'Add items to cart and checkout',
  },
  {
    name: 'Favorites',
    status: 'coming-soon',
    icon: <Heart className="h-5 w-5" />,
    description: 'Save your favorite items to a wishlist',
  },
  {
    name: 'Reviews',
    status: 'coming-soon',
    icon: <Star className="h-5 w-5" />,
    description: 'Read and write product reviews',
  },
];

export function MarketplaceStatus() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Marketplace Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're building a platform to connect local artisans with customers. 
            Here's what's available now and what's coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    feature.status === 'live'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-orange-500/10 text-orange-500'
                  }`}
                >
                  {feature.status === 'live' ? (
                    feature.icon
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">
                      {feature.name}
                    </h3>
                    <Badge
                      variant={feature.status === 'live' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {feature.status === 'live' ? 'Live' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block bg-primary/10 rounded-lg px-6 py-4 border border-primary/20">
            <p className="text-sm text-foreground">
              <strong>Development Status:</strong> Database schema created, authentication working.
              <br />
              Marketplace UI coming soon as types regenerate.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
