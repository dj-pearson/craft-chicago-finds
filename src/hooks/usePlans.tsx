import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  stripe_price_id: string;
  features: string[];
  popular?: boolean;
  max_listings: number | null; // null = unlimited
  featured_listings: number;
  analytics_enabled: boolean;
  priority_support: boolean;
  custom_branding: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  plan: Plan;
}

interface PlansContextType {
  plans: Plan[];
  currentSubscription: Subscription | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  subscribeToPlan: (planId: string) => Promise<string>; // Returns checkout URL
  cancelSubscription: () => Promise<void>;
  isFeatureAvailable: (feature: string) => boolean;
  getRemainingListings: () => number | null; // null = unlimited
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price');

      if (error) throw error;
      setPlans(data as Plan[] || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setCurrentSubscription(data as any);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await fetchCurrentSubscription();
  };

  const subscribeToPlan = async (planId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan_id: planId,
          success_url: `${window.location.origin}/seller-dashboard?subscription=success`,
          cancel_url: `${window.location.origin}/pricing`
        }
      });

      if (error) throw error;
      return data.checkout_url;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!currentSubscription) throw new Error('No active subscription');

    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscription_id: currentSubscription.stripe_subscription_id
        }
      });

      if (error) throw error;
      await refreshSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  const isFeatureAvailable = (feature: string): boolean => {
    if (!currentSubscription) return false;
    
    const plan = currentSubscription.plan;
    switch (feature) {
      case 'analytics':
        return plan.analytics_enabled;
      case 'priority_support':
        return plan.priority_support;
      case 'custom_branding':
        return plan.custom_branding;
      case 'featured_listings':
        return plan.featured_listings > 0;
      default:
        return false;
    }
  };

  const getRemainingListings = (): number | null => {
    if (!currentSubscription) return 5; // Free tier limit
    
    const plan = currentSubscription.plan;
    if (plan.max_listings === null) return null; // Unlimited
    
    // Would need to fetch current listing count from database
    // For now, return the plan limit
    return plan.max_listings;
  };

  return (
    <PlansContext.Provider value={{
      plans,
      currentSubscription,
      loading,
      refreshSubscription,
      subscribeToPlan,
      cancelSubscription,
      isFeatureAvailable,
      getRemainingListings
    }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
};