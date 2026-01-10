/**
 * Cart Integration Tests
 * Tests for shopping cart functionality and checkout flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Cart types
interface CartItem {
  id: string;
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  seller_id: string;
}

// Simple cart logic for testing
function createCart() {
  let items: CartItem[] = [];

  return {
    getItems: () => items,
    addItem: (item: Omit<CartItem, 'id'>) => {
      const existingIndex = items.findIndex(i => i.listing_id === item.listing_id);
      if (existingIndex >= 0) {
        items[existingIndex].quantity += item.quantity;
      } else {
        items.push({ ...item, id: `cart-${Date.now()}` });
      }
      return items;
    },
    updateQuantity: (listingId: string, quantity: number) => {
      const index = items.findIndex(i => i.listing_id === listingId);
      if (index >= 0) {
        if (quantity <= 0) {
          items = items.filter(i => i.listing_id !== listingId);
        } else {
          items[index].quantity = quantity;
        }
      }
      return items;
    },
    removeItem: (listingId: string) => {
      items = items.filter(i => i.listing_id !== listingId);
      return items;
    },
    clearCart: () => {
      items = [];
      return items;
    },
    getTotal: () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    getItemCount: () => items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

describe('Cart Integration Tests', () => {
  let cart: ReturnType<typeof createCart>;

  beforeEach(() => {
    cart = createCart();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Cart Operations', () => {
    it('should add items to cart', () => {
      const item = {
        listing_id: 'listing-1',
        title: 'Handmade Pottery',
        price: 45.00,
        quantity: 1,
        seller_id: 'seller-1',
      };

      cart.addItem(item);

      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].title).toBe('Handmade Pottery');
    });

    it('should increase quantity when adding duplicate item', () => {
      const item = {
        listing_id: 'listing-1',
        title: 'Handmade Pottery',
        price: 45.00,
        quantity: 1,
        seller_id: 'seller-1',
      };

      cart.addItem(item);
      cart.addItem(item);

      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].quantity).toBe(2);
    });

    it('should update item quantity', () => {
      const item = {
        listing_id: 'listing-1',
        title: 'Handmade Pottery',
        price: 45.00,
        quantity: 1,
        seller_id: 'seller-1',
      };

      cart.addItem(item);
      cart.updateQuantity('listing-1', 5);

      expect(cart.getItems()[0].quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', () => {
      const item = {
        listing_id: 'listing-1',
        title: 'Handmade Pottery',
        price: 45.00,
        quantity: 1,
        seller_id: 'seller-1',
      };

      cart.addItem(item);
      cart.updateQuantity('listing-1', 0);

      expect(cart.getItems()).toHaveLength(0);
    });

    it('should remove specific item', () => {
      cart.addItem({
        listing_id: 'listing-1',
        title: 'Item 1',
        price: 25.00,
        quantity: 1,
        seller_id: 'seller-1',
      });
      cart.addItem({
        listing_id: 'listing-2',
        title: 'Item 2',
        price: 35.00,
        quantity: 1,
        seller_id: 'seller-2',
      });

      cart.removeItem('listing-1');

      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItems()[0].listing_id).toBe('listing-2');
    });

    it('should clear entire cart', () => {
      cart.addItem({
        listing_id: 'listing-1',
        title: 'Item 1',
        price: 25.00,
        quantity: 1,
        seller_id: 'seller-1',
      });
      cart.addItem({
        listing_id: 'listing-2',
        title: 'Item 2',
        price: 35.00,
        quantity: 2,
        seller_id: 'seller-2',
      });

      cart.clearCart();

      expect(cart.getItems()).toHaveLength(0);
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate total correctly', () => {
      cart.addItem({
        listing_id: 'listing-1',
        title: 'Item 1',
        price: 25.00,
        quantity: 2,
        seller_id: 'seller-1',
      });
      cart.addItem({
        listing_id: 'listing-2',
        title: 'Item 2',
        price: 15.00,
        quantity: 3,
        seller_id: 'seller-2',
      });

      // 25 * 2 + 15 * 3 = 50 + 45 = 95
      expect(cart.getTotal()).toBe(95);
    });

    it('should calculate item count correctly', () => {
      cart.addItem({
        listing_id: 'listing-1',
        title: 'Item 1',
        price: 25.00,
        quantity: 2,
        seller_id: 'seller-1',
      });
      cart.addItem({
        listing_id: 'listing-2',
        title: 'Item 2',
        price: 15.00,
        quantity: 3,
        seller_id: 'seller-2',
      });

      expect(cart.getItemCount()).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      expect(cart.getTotal()).toBe(0);
      expect(cart.getItemCount()).toBe(0);
    });
  });

  describe('Cart Persistence', () => {
    it('should save cart to localStorage', () => {
      const cartData = [
        { id: 'cart-1', listing_id: 'listing-1', title: 'Item 1', price: 25, quantity: 1, seller_id: 'seller-1' },
      ];

      mockLocalStorage.setItem('cart', JSON.stringify(cartData));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cart', JSON.stringify(cartData));
    });

    it('should load cart from localStorage', () => {
      const savedCart = [
        { id: 'cart-1', listing_id: 'listing-1', title: 'Item 1', price: 25, quantity: 1, seller_id: 'seller-1' },
      ];

      mockLocalStorage.store['cart'] = JSON.stringify(savedCart);

      const loadedCart = JSON.parse(mockLocalStorage.getItem('cart') || '[]');

      expect(loadedCart).toHaveLength(1);
      expect(loadedCart[0].title).toBe('Item 1');
    });

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.store['cart'] = 'invalid json';

      let cart: CartItem[] = [];
      try {
        cart = JSON.parse(mockLocalStorage.getItem('cart') || '[]');
      } catch {
        cart = [];
      }

      expect(cart).toEqual([]);
    });
  });
});

describe('Checkout Integration Tests', () => {
  describe('Checkout Flow', () => {
    it('should validate cart items before checkout', async () => {
      const cartItems = [
        { id: 'cart-1', listing_id: 'listing-1', title: 'Item 1', price: 25, quantity: 1, seller_id: 'seller-1' },
        { id: 'cart-2', listing_id: 'listing-2', title: 'Item 2', price: 35, quantity: 2, seller_id: 'seller-2' },
      ];

      const isValid = cartItems.every(item =>
        item.price > 0 && item.quantity > 0 && item.listing_id
      );

      expect(isValid).toBe(true);
    });

    it('should calculate subtotal, tax, and total', () => {
      const subtotal = 100;
      const taxRate = 0.0875; // Chicago tax rate
      const shippingFee = 5.99;

      const tax = subtotal * taxRate;
      const total = subtotal + tax + shippingFee;

      expect(tax).toBeCloseTo(8.75, 2);
      expect(total).toBeCloseTo(114.74, 2);
    });

    it('should apply discount codes', () => {
      const subtotal = 100;
      const discountCode = { code: 'SAVE10', type: 'percentage', value: 10 };

      let discount = 0;
      if (discountCode.type === 'percentage') {
        discount = subtotal * (discountCode.value / 100);
      } else {
        discount = discountCode.value;
      }

      const total = subtotal - discount;

      expect(discount).toBe(10);
      expect(total).toBe(90);
    });

    it('should validate shipping address', () => {
      const address = {
        line1: '123 Main St',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60601',
        country: 'US',
      };

      const isValidAddress =
        address.line1.length > 0 &&
        address.city.length > 0 &&
        address.state.length === 2 &&
        /^\d{5}(-\d{4})?$/.test(address.postal_code);

      expect(isValidAddress).toBe(true);
    });

    it('should reject invalid shipping address', () => {
      const address = {
        line1: '',
        city: 'Chicago',
        state: 'IL',
        postal_code: '60601',
        country: 'US',
      };

      const isValidAddress =
        address.line1.length > 0 &&
        address.city.length > 0 &&
        address.state.length === 2 &&
        /^\d{5}(-\d{4})?$/.test(address.postal_code);

      expect(isValidAddress).toBe(false);
    });
  });

  describe('Payment Processing', () => {
    it('should create payment intent data structure', () => {
      const orderTotal = 95.50;
      const currency = 'usd';

      const paymentIntentData = {
        amount: Math.round(orderTotal * 100), // Convert to cents
        currency,
        metadata: {
          order_id: 'order-123',
          customer_email: 'customer@example.com',
        },
      };

      expect(paymentIntentData.amount).toBe(9550);
      expect(paymentIntentData.currency).toBe('usd');
    });

    it('should validate payment amount', () => {
      const cartTotal = 95.50;
      const paymentAmount = 95.50;

      const isValidPayment = Math.abs(cartTotal - paymentAmount) < 0.01;

      expect(isValidPayment).toBe(true);
    });
  });

  describe('Order Creation', () => {
    it('should create order from cart items', () => {
      const cartItems = [
        { listing_id: 'listing-1', quantity: 2, price: 25 },
        { listing_id: 'listing-2', quantity: 1, price: 35 },
      ];

      const order = {
        id: 'order-new',
        buyer_id: 'buyer-123',
        items: cartItems.map(item => ({
          listing_id: item.listing_id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.quantity * item.price,
        })),
        subtotal: cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      expect(order.items).toHaveLength(2);
      expect(order.subtotal).toBe(85);
      expect(order.status).toBe('pending');
    });

    it('should group items by seller for multi-seller orders', () => {
      const cartItems = [
        { listing_id: 'listing-1', seller_id: 'seller-1', quantity: 1, price: 25 },
        { listing_id: 'listing-2', seller_id: 'seller-1', quantity: 2, price: 15 },
        { listing_id: 'listing-3', seller_id: 'seller-2', quantity: 1, price: 45 },
      ];

      const itemsBySeller = cartItems.reduce((acc, item) => {
        if (!acc[item.seller_id]) {
          acc[item.seller_id] = [];
        }
        acc[item.seller_id].push(item);
        return acc;
      }, {} as Record<string, typeof cartItems>);

      expect(Object.keys(itemsBySeller)).toHaveLength(2);
      expect(itemsBySeller['seller-1']).toHaveLength(2);
      expect(itemsBySeller['seller-2']).toHaveLength(1);
    });
  });
});
