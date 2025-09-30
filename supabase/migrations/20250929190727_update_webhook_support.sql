-- Update webhook_logs table to support multiple content types (social and blog)
-- Drop the old foreign key constraint
ALTER TABLE public.webhook_logs
DROP CONSTRAINT IF EXISTS webhook_logs_post_id_fkey;

-- Rename post_id to content_id for generic content support
ALTER TABLE public.webhook_logs
RENAME COLUMN post_id TO content_id;

-- Add content_type column to track what type of content the webhook is for
ALTER TABLE public.webhook_logs
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'social_post' CHECK (content_type IN ('social_post', 'blog_article'));

-- Add webhook_settings_id for better tracking
ALTER TABLE public.webhook_logs
ADD COLUMN IF NOT EXISTS webhook_settings_id UUID REFERENCES public.webhook_settings(id);

-- Rename request_payload to payload for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs'
    AND column_name = 'request_payload'
  ) THEN
    ALTER TABLE public.webhook_logs RENAME COLUMN request_payload TO payload;
  END IF;
END $$;

-- Update webhook_settings to support content types
ALTER TABLE public.webhook_settings
ADD COLUMN IF NOT EXISTS content_types TEXT[] DEFAULT ARRAY['social_post', 'blog_article'];

-- Add custom headers support to webhook_settings
ALTER TABLE public.webhook_settings
ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT '{}'::jsonb;

-- Update indexes
DROP INDEX IF EXISTS idx_webhook_logs_post_id;
CREATE INDEX IF NOT EXISTS idx_webhook_logs_content_id ON public.webhook_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_content_type ON public.webhook_logs(content_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_settings ON public.webhook_logs(webhook_settings_id);

-- Add comment to clarify the table's purpose
COMMENT ON TABLE public.webhook_logs IS 'Logs for all webhook deliveries, supporting both social media posts and blog articles';
COMMENT ON COLUMN public.webhook_logs.content_id IS 'UUID of the content (post or article) that triggered the webhook';
COMMENT ON COLUMN public.webhook_logs.content_type IS 'Type of content: social_post or blog_article';