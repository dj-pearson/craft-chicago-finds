/**
 * Test Utilities
 * Provides custom render functions and test helpers
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Mock Auth Context
interface MockAuthContextType {
  user: {
    id: string;
    email: string;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const defaultMockAuth: MockAuthContextType = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
};

interface TestProviderProps {
  children: ReactNode;
  authContext?: Partial<MockAuthContextType>;
}

// All providers wrapper for testing
function AllProviders({ children, authContext = {} }: TestProviderProps) {
  const queryClient = createTestQueryClient();
  const mergedAuth = { ...defaultMockAuth, ...authContext };

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: Partial<MockAuthContextType>;
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { authContext, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders authContext={authContext}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
export { customRender as render };
export { createTestQueryClient };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockListing = (overrides = {}) => ({
  id: 'test-listing-id',
  title: 'Test Product',
  description: 'A test product description',
  price: 29.99,
  seller_id: 'test-seller-id',
  category: 'handmade',
  images: ['https://example.com/image.jpg'],
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 'test-order-id',
  buyer_id: 'test-buyer-id',
  seller_id: 'test-seller-id',
  status: 'pending',
  total: 29.99,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Wait for async updates
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    const loaders = document.querySelectorAll('[data-testid="loading"]');
    if (loaders.length > 0) {
      throw new Error('Still loading');
    }
  });
};

// Mock Supabase client for tests
export const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
};

// Import vi from vitest for mocking
import { vi } from 'vitest';
