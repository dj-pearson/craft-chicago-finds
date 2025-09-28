import { createContext, useContext, useEffect, useState } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51QM5vxFxgc4C2V6oEKrEqyKmXqU6FeSzKEu2YJHFlXYkV8V1r3JcH8AcXNJqWHWYO8TLHtPJqWZhN1pQN1qJ9Kk900e7x1pGm9');

interface StripeContextType {
  stripe: Stripe | null;
  isLoading: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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