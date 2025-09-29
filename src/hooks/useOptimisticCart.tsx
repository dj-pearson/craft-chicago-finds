import { useState, useCallback } from 'react';
import { useCart, CartItem } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdate {
  id: string;
  type: 'add' | 'remove' | 'update';
  item?: CartItem;
  quantity?: number;
  timestamp: number;
}

export const useOptimisticCart = () => {
  const { items, addItem, removeItem, updateQuantity, ...cartMethods } = useCart();
  const { toast } = useToast();
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([]);
  const [isOptimistic, setIsOptimistic] = useState(false);

  // Optimistic add to cart
  const optimisticAddItem = useCallback(async (
    item: Omit<CartItem, 'quantity'>, 
    quantity = 1
  ) => {
    const updateId = `add-${Date.now()}`;
    const cartItem: CartItem = { ...item, quantity };
    
    // Create optimistic update
    const update: OptimisticUpdate = {
      id: updateId,
      type: 'add',
      item: cartItem,
      timestamp: Date.now()
    };

    setPendingUpdates(prev => [...prev, update]);
    setIsOptimistic(true);

    // Show optimistic toast immediately
    toast({
      title: "Added to cart",
      description: `${item.title} has been added to your cart`,
      duration: 2000,
    });

    try {
      // Perform actual cart update
      await new Promise(resolve => {
        addItem(item, quantity);
        // Simulate network delay for demonstration
        setTimeout(resolve, 100);
      });

      // Remove pending update on success
      setPendingUpdates(prev => prev.filter(u => u.id !== updateId));
      
      // Check if this was the last pending update
      setPendingUpdates(prev => {
        if (prev.length === 0) {
          setIsOptimistic(false);
        }
        return prev;
      });

    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      // Revert optimistic update on failure
      setPendingUpdates(prev => prev.filter(u => u.id !== updateId));
      setIsOptimistic(false);
      
      toast({
        title: "Failed to add to cart",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [addItem, toast]);

  // Optimistic remove from cart
  const optimisticRemoveItem = useCallback(async (listingId: string) => {
    const updateId = `remove-${Date.now()}`;
    const existingItem = items.find(item => item.listing_id === listingId);
    
    if (!existingItem) return;

    const update: OptimisticUpdate = {
      id: updateId,
      type: 'remove',
      item: existingItem,
      timestamp: Date.now()
    };

    setPendingUpdates(prev => [...prev, update]);
    setIsOptimistic(true);

    // Show optimistic toast
    toast({
      title: "Removed from cart",
      description: `${existingItem.title} has been removed`,
      duration: 2000,
    });

    try {
      await new Promise(resolve => {
        removeItem(listingId);
        setTimeout(resolve, 100);
      });

      setPendingUpdates(prev => prev.filter(u => u.id !== updateId));
      setPendingUpdates(prev => {
        if (prev.length === 0) {
          setIsOptimistic(false);
        }
        return prev;
      });

    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      
      setPendingUpdates(prev => prev.filter(u => u.id !== updateId));
      setIsOptimistic(false);
      
      toast({
        title: "Failed to remove item",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [items, removeItem, toast]);

  // Optimistic quantity update
  const optimisticUpdateQuantity = useCallback(async (
    listingId: string, 
    newQuantity: number
  ) => {
    const updateId = `update-${Date.now()}`;
    const existingItem = items.find(item => item.listing_id === listingId);
    
    if (!existingItem) return;

    const update: OptimisticUpdate = {
      id: updateId,
      type: 'update',
      item: existingItem,
      quantity: newQuantity,
      timestamp: Date.now()
    };

    setPendingUpdates(prev => [...prev, update]);
    setIsOptimistic(true);

    try {
      await new Promise(resolve => {
        updateQuantity(listingId, newQuantity);
        setTimeout(resolve, 100);
      });

      setPendingUpdates(prev => prev.filter(u => u.id !== updateId));
      setPendingUpdates(prev => {
        if (prev.length === 0) {
          setIsOptimistic(false);
        }
        return prev;
      });

    } catch (error) {
      console.error('Failed to update quantity:', error);
      
      setPendingUpdates(prev => prev.filter(u => u.id !== updateId));
      setIsOptimistic(false);
      
      toast({
        title: "Failed to update quantity",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [items, updateQuantity, toast]);

  // Get optimistic cart state
  const getOptimisticItems = useCallback(() => {
    let optimisticItems = [...items];
    
    // Apply pending updates in chronological order
    const sortedUpdates = [...pendingUpdates].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const update of sortedUpdates) {
      switch (update.type) {
        case 'add':
          if (update.item) {
            const existingIndex = optimisticItems.findIndex(
              item => item.listing_id === update.item!.listing_id
            );
            if (existingIndex >= 0) {
              // Update existing item quantity
              optimisticItems[existingIndex] = {
                ...optimisticItems[existingIndex],
                quantity: optimisticItems[existingIndex].quantity + update.item.quantity
              };
            } else {
              // Add new item
              optimisticItems.push(update.item);
            }
          }
          break;
          
        case 'remove':
          if (update.item) {
            optimisticItems = optimisticItems.filter(
              item => item.listing_id !== update.item!.listing_id
            );
          }
          break;
          
        case 'update':
          if (update.item && update.quantity !== undefined) {
            const index = optimisticItems.findIndex(
              item => item.listing_id === update.item!.listing_id
            );
            if (index >= 0) {
              if (update.quantity <= 0) {
                optimisticItems.splice(index, 1);
              } else {
                optimisticItems[index] = {
                  ...optimisticItems[index],
                  quantity: update.quantity
                };
              }
            }
          }
          break;
      }
    }
    
    return optimisticItems;
  }, [items, pendingUpdates]);

  // Calculate optimistic totals
  const getOptimisticTotals = useCallback(() => {
    const optimisticItems = getOptimisticItems();
    const itemCount = optimisticItems.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = optimisticItems.reduce((total, item) => {
      const basePrice = item.price * item.quantity;
      const personalizationCost = (item.personalization_cost || 0) * item.quantity;
      return total + basePrice + personalizationCost;
    }, 0);
    
    return { itemCount, totalAmount };
  }, [getOptimisticItems]);

  return {
    // Original cart methods
    ...cartMethods,
    
    // Optimistic methods
    optimisticAddItem,
    optimisticRemoveItem,
    optimisticUpdateQuantity,
    
    // Optimistic state
    items: getOptimisticItems(),
    ...getOptimisticTotals(),
    
    // Status
    isOptimistic,
    pendingUpdates: pendingUpdates.length,
    
    // Fallback to original methods
    addItem: optimisticAddItem,
    removeItem: optimisticRemoveItem,
    updateQuantity: optimisticUpdateQuantity,
  };
};
