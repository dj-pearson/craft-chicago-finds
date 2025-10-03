-- Create newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'footer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on email (case insensitive)
CREATE UNIQUE INDEX idx_newsletter_subscriptions_email ON public.newsletter_subscriptions (LOWER(email));

-- Create indexes for performance
CREATE INDEX idx_newsletter_subscriptions_active ON public.newsletter_subscriptions (is_active);
CREATE INDEX idx_newsletter_subscriptions_source ON public.newsletter_subscriptions (source);
CREATE INDEX idx_newsletter_subscriptions_subscribed_at ON public.newsletter_subscriptions (subscribed_at);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own subscription"
ON public.newsletter_subscriptions
FOR SELECT
USING (
  auth.jwt() ->> 'email' = email OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Users can update their own subscription"
ON public.newsletter_subscriptions
FOR UPDATE
USING (
  auth.jwt() ->> 'email' = email OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage all newsletter subscriptions"
ON public.newsletter_subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_newsletter_subscriptions_updated_at 
  BEFORE UPDATE ON public.newsletter_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.update_newsletter_updated_at();

-- Add comments
COMMENT ON TABLE public.newsletter_subscriptions IS 'Stores newsletter subscription information';
COMMENT ON COLUMN public.newsletter_subscriptions.email IS 'Subscriber email address (case insensitive)';
COMMENT ON COLUMN public.newsletter_subscriptions.name IS 'Optional subscriber name';
COMMENT ON COLUMN public.newsletter_subscriptions.source IS 'Where the subscription came from (footer, popup, etc.)';
COMMENT ON COLUMN public.newsletter_subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN public.newsletter_subscriptions.subscribed_at IS 'When the user first subscribed';
COMMENT ON COLUMN public.newsletter_subscriptions.unsubscribed_at IS 'When the user unsubscribed (if applicable)';

-- Create view for active subscriptions
CREATE VIEW public.active_newsletter_subscriptions AS
SELECT *
FROM public.newsletter_subscriptions
WHERE is_active = true;

-- Grant permissions for the view
GRANT SELECT ON public.active_newsletter_subscriptions TO anon, authenticated;
