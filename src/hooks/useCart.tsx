import { createContext, useContext, useEffect, useReducer } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  max_quantity: number;
  image?: string;
  seller_id: string;
  seller_name: string;
  shipping_available: boolean;
  local_pickup_available: boolean;
  pickup_location?: string;
  personalizations?: Record<string, any>;
  personalization_cost?: number;
  bundle_id?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (listingId: string) => boolean;
  getCartItem: (listingId: string) => CartItem | undefined;
}

type CartAction =
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { item: Omit<CartItem, 'quantity'>; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { listingId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case 'SET_ITEMS':
      return action.payload;
      
    case 'ADD_ITEM': {
      const { item, quantity } = action.payload;
      const existingItem = state.find(i => i.listing_id === item.listing_id);
      
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, item.max_quantity);
        return state.map(i =>
          i.listing_id === item.listing_id
            ? { ...i, quantity: newQuantity }
            : i
        );
      } else {
        return [...state, { ...item, quantity }];
      }
    }
    
    case 'REMOVE_ITEM':
      return state.filter(i => i.listing_id !== action.payload);
      
    case 'UPDATE_QUANTITY': {
      const { listingId, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter(i => i.listing_id !== listingId);
      }
      return state.map(item =>
        item.listing_id === listingId
          ? { ...item, quantity: Math.min(quantity, item.max_quantity) }
          : item
      );
    }
    
    case 'CLEAR_CART':
      return [];
      
    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, dispatch] = useReducer(cartReducer, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${user?.id || 'guest'}`);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'SET_ITEMS', payload: parsedCart });
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem(`cart_${user?.id || 'guest'}`);
      }
    }
  }, [user?.id]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(`cart_${user?.id || 'guest'}`, JSON.stringify(items));
  }, [items, user?.id]);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const existingItem = items.find(i => i.listing_id === item.listing_id);
    const newQuantity = existingItem 
      ? Math.min(existingItem.quantity + quantity, item.max_quantity)
      : quantity;
    
    if (existingItem && newQuantity > existingItem.quantity) {
      toast({
        title: "Cart updated",
        description: `Updated ${item.title} quantity to ${newQuantity}`,
      });
    } else if (existingItem && newQuantity === existingItem.quantity) {
      toast({
        title: "Cannot add more",
        description: `Maximum available quantity is ${item.max_quantity}`,
        variant: "destructive"
      });
    } else if (!existingItem) {
      toast({
        title: "Added to cart",
        description: `${item.title} has been added to your cart`,
      });
    }
    
    dispatch({ type: 'ADD_ITEM', payload: { item, quantity } });
  };

  const removeItem = (listingId: string) => {
    const item = items.find(i => i.listing_id === listingId);
    if (item) {
      toast({
        title: "Removed from cart",
        description: `${item.title} has been removed from your cart`,
      });
    }
    dispatch({ type: 'REMOVE_ITEM', payload: listingId });
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { listingId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  const isInCart = (listingId: string) => {
    return items.some(item => item.listing_id === listingId);
  };

  const getCartItem = (listingId: string) => {
    return items.find(item => item.listing_id === listingId);
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = items.reduce((total, item) => {
    const basePrice = item.price * item.quantity;
    const personalizationCost = (item.personalization_cost || 0) * item.quantity;
    return total + basePrice + personalizationCost;
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      totalAmount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getCartItem
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};