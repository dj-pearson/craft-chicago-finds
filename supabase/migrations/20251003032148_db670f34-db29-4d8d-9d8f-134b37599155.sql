-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage webhook settings" ON public.webhook_settings;
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;

-- Create webhook_settings table for blog webhooks
CREATE TABLE IF NOT EXISTS public.webhook_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_type TEXT NOT NULL DEFAULT 'social_media',
  is_active BOOLEAN NOT NULL DEFAULT true,
  supports_blog BOOLEAN NOT NULL DEFAULT false,
  supports_social BOOLEAN NOT NULL DEFAULT false,
  secret_key TEXT,
  headers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_settings
ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for webhook_settings
CREATE POLICY "Admins can manage webhook settings"
ON public.webhook_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
    AND is_active = true
  )
);

-- Add webhook_settings_id to blog_articles
ALTER TABLE public.blog_articles
ADD COLUMN IF NOT EXISTS webhook_settings_id UUID REFERENCES public.webhook_settings(id);

-- Create webhook_logs table to track all webhook sends
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_settings_id UUID NOT NULL REFERENCES public.webhook_settings(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  request_payload JSONB NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for webhook_logs
CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
    AND is_active = true
  )
);

-- Create trigger for webhook_settings updated_at
DROP TRIGGER IF EXISTS update_webhook_settings_updated_at ON public.webhook_settings;
CREATE TRIGGER update_webhook_settings_updated_at
BEFORE UPDATE ON public.webhook_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();