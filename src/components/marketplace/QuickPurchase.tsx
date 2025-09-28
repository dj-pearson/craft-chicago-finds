import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, CreditCard, Shield, Truck, Heart } from 'lucide-react';

interface QuickPurchaseCardProps {
  title: string;
  price: number;
  image?: string;
  seller: string;
  location: string;
  onQuickBuy: () => void;
}

export const QuickPurchaseCard = ({ 
  title, 
  price, 
  image, 
  seller, 
  location, 
  onQuickBuy 
}: QuickPurchaseCardProps) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await onQuickBuy();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        {image ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground">by {seller}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {location}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary">${price}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secure</span>
          </div>
        </div>
        
        <Button 
          onClick={handlePurchase}
          disabled={loading}
          className="w-full group/btn"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Quick Buy
              <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

interface FeaturedProductsGridProps {
  products: Array<{
    id: string;
    title: string;
    price: number;
    image?: string;
    seller: string;
    location: string;
  }>;
  onProductSelect: (productId: string) => void;
}

export const FeaturedProductsGrid = ({ products, onProductSelect }: FeaturedProductsGridProps) => {
  const navigate = useNavigate();

  const handleQuickBuy = (productId: string) => {
    onProductSelect(productId);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <QuickPurchaseCard
          key={product.id}
          title={product.title}
          price={product.price}
          image={product.image}
          seller={product.seller}
          location={product.location}
          onQuickBuy={() => handleQuickBuy(product.id)}
        />
      ))}
    </div>
  );
};