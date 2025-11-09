import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  listing: {
    id: string;
    title: string;
    price: number;
    seller_id: string;
    inventory_count: number | null;
    local_pickup_available: boolean;
    shipping_available: boolean;
    pickup_location?: string;
    images?: string[];
    seller?: {
      display_name: string;
    };
  };
  personalizations?: Record<string, any>;
  personalizationCost?: number;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
}

export const AddToCartButton = ({ 
  listing, 
  personalizations,
  personalizationCost = 0,
  className = "", 
  variant = "default",
  size = "default",
  disabled = false
}: AddToCartButtonProps) => {
  const { addItem, isInCart, getCartItem, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  const maxQuantity = listing.inventory_count || 999;
  const cartItem = getCartItem(listing.id);
  const currentCartQuantity = cartItem?.quantity || 0;
  const availableToAdd = Math.max(0, maxQuantity - currentCartQuantity);
  
  const isOutOfStock = maxQuantity === 0;
  const canAddMore = availableToAdd > 0;

  const handleAddToCart = () => {
    if (!canAddMore) {
      toast.error('Unable to add more items', {
        description: 'This item is out of stock or you\'ve reached the maximum quantity.'
      });
      return;
    }

    try {
      const item = {
        id: listing.id,
        listing_id: listing.id,
        title: listing.title,
        price: listing.price,
        max_quantity: maxQuantity,
        image: listing.images?.[0],
        seller_id: listing.seller_id,
        seller_name: listing.seller?.display_name || 'Unknown Seller',
        shipping_available: listing.shipping_available,
        local_pickup_available: listing.local_pickup_available,
        pickup_location: listing.pickup_location,
        personalizations,
        personalization_cost: personalizationCost
      };

      addItem(item, Math.min(quantity, availableToAdd));

      const addedQty = Math.min(quantity, availableToAdd);
      toast.success('Added to cart!', {
        description: `${addedQty} × ${listing.title}${addedQty > 1 ? 's' : ''} added to your cart.`
      });

      setQuantity(1);
    } catch (error) {
      toast.error('Failed to add to cart', {
        description: 'Please try again.'
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (cartItem) {
      if (newQuantity <= 0) {
        toast.info('Item removed from cart', {
          description: `${listing.title} has been removed.`
        });
      }
      updateQuantity(listing.id, newQuantity);
    }
  };

  if (isOutOfStock) {
    return (
      <Button disabled variant="outline" size={size} className={className}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Out of Stock
      </Button>
    );
  }

  if (isInCart(listing.id)) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(currentCartQuantity - 1)}
            disabled={currentCartQuantity <= 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={currentCartQuantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
            className="w-16 text-center"
            min="0"
            max={maxQuantity}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleQuantityChange(currentCartQuantity + 1)}
            disabled={currentCartQuantity >= maxQuantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Badge variant="secondary">
          In Cart
        </Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {availableToAdd < 10 && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(availableToAdd, parseInt(e.target.value) || 1)))}
            className="w-16 text-center"
            min="1"
            max={availableToAdd}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuantity(Math.min(availableToAdd, quantity + 1))}
            disabled={quantity >= availableToAdd}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <Button 
        onClick={handleAddToCart}
        disabled={!canAddMore || disabled}
        variant={variant}
        size={size}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
        {availableToAdd < maxQuantity && (
          <Badge variant="secondary" className="ml-2">
            {availableToAdd} left
          </Badge>
        )}
      </Button>
    </div>
  );
};