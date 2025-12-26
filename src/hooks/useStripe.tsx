import { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Track if Stripe is properly configured
export const isStripeConfigured = Boolean(STRIPE_PUBLISHABLE_KEY);

if (!isStripeConfigured) {
  console.error(
    'Missing Stripe publishable key. ' +
    'Please ensure VITE_STRIPE_PUBLISHABLE_KEY is set in your .env file. ' +
    'Payment features will be unavailable.'
  );
}

// Only load Stripe if configured
const stripePromise = isStripeConfigured ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(isStripeConfigured);

  useEffect(() => {
    // If Stripe is not configured, skip initialization
    if (!isStripeConfigured || !stripePromise) {
      return;
    }

    const initializeStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);

  return (
    <StripeContext.Provider value={{ stripe, isLoading }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};