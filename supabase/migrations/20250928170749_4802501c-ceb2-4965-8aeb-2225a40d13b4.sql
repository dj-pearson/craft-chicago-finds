-- Create plans table for subscription plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  stripe_price_id TEXT UNIQUE NOT NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  popular BOOLEAN NOT NULL DEFAULT false,
  max_listings INTEGER, -- null means unlimited
  featured_listings INTEGER NOT NULL DEFAULT 0,
  analytics_enabled BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  custom_branding BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add stripe_customer_id to profiles table
ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans policies (public read, admin manage)
CREATE POLICY "Plans are viewable by everyone" 
ON public.plans FOR SELECT USING (true);

CREATE POLICY "Admins can manage plans" 
ON public.plans FOR ALL USING (is_admin(auth.uid()));

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" 
ON public.subscriptions FOR ALL USING (true); -- This will be restricted by API

-- Create update trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create update trigger for plans
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.plans (name, price, interval, stripe_price_id, features, popular, max_listings, featured_listings, analytics_enabled, priority_support, custom_branding) VALUES
('Free', 0.00, 'month', 'price_free', ARRAY['5 listings', 'Basic analytics', 'Community support'], false, 5, 0, false, false, false),
('Pro', 19.99, 'month', 'price_pro_monthly', ARRAY['Unlimited listings', '3 featured listings', 'Advanced analytics', 'Priority support', 'Custom branding'], true, null, 3, true, true, true),
('Pro', 199.99, 'year', 'price_pro_yearly', ARRAY['Unlimited listings', '3 featured listings', 'Advanced analytics', 'Priority support', 'Custom branding', 'Save 20%'], false, null, 3, true, true, true),
('Premium', 49.99, 'month', 'price_premium_monthly', ARRAY['Unlimited listings', '10 featured listings', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access'], false, null, 10, true, true, true),
('Premium', 499.99, 'year', 'price_premium_yearly', ARRAY['Unlimited listings', '10 featured listings', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access', 'Save 20%'], false, null, 10, true, true, true);