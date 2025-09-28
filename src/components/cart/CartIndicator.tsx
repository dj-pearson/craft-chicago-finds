import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const CartIndicator = ({ className = "", showLabel = true }: CartIndicatorProps) => {
  const { itemCount, totalAmount } = useCart();
  const navigate = useNavigate();

  if (itemCount === 0 && !showLabel) {
    return (
      <Button variant="ghost" size="sm" onClick={() => navigate('/cart')} className={className}>
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => navigate('/cart')} 
      className={`relative ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {showLabel && <span className="ml-2">Cart</span>}
      
      {itemCount > 0 && (
        <>
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
          {showLabel && (
            <span className="ml-2 text-sm font-medium">
              ${totalAmount.toFixed(2)}
            </span>
          )}
        </>
      )}
    </Button>
  );
};