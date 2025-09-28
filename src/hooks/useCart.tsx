import { createContext, useContext, useEffect, useState } from 'react';
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${user?.id || 'guest'}`);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
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
    setItems(currentItems => {
      const existingItem = currentItems.find(i => i.listing_id === item.listing_id);
      
      if (existingItem) {
        // Update quantity if item already exists
        const newQuantity = Math.min(existingItem.quantity + quantity, item.max_quantity);
        
        if (newQuantity > existingItem.quantity) {
          toast({
            title: "Cart updated",
            description: `Updated ${item.title} quantity to ${newQuantity}`,
          });
        } else {
          toast({
            title: "Cannot add more",
            description: `Maximum available quantity is ${item.max_quantity}`,
            variant: "destructive"
          });
        }
        
        return currentItems.map(i =>
          i.listing_id === item.listing_id
            ? { ...i, quantity: newQuantity }
            : i
        );
      } else {
        // Add new item
        const newItem: CartItem = { ...item, quantity };
        toast({
          title: "Added to cart",
          description: `${item.title} has been added to your cart`,
        });
        return [...currentItems, newItem];
      }
    });
  };

  const removeItem = (listingId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(i => i.listing_id === listingId);
      if (item) {
        toast({
          title: "Removed from cart",
          description: `${item.title} has been removed from your cart`,
        });
      }
      return currentItems.filter(i => i.listing_id !== listingId);
    });
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(listingId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.listing_id === listingId
          ? { ...item, quantity: Math.min(quantity, item.max_quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
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
  const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

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