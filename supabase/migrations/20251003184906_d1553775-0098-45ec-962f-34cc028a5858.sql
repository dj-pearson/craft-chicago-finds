-- Add webhook_type and auto_publish columns to webhook_settings if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_settings' AND column_name = 'webhook_type'
  ) THEN
    ALTER TABLE public.webhook_settings ADD COLUMN webhook_type TEXT NOT NULL DEFAULT 'generic';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_settings' AND column_name = 'auto_publish'
  ) THEN
    ALTER TABLE public.webhook_settings ADD COLUMN auto_publish BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_settings' AND column_name = 'retry_config'
  ) THEN
    ALTER TABLE public.webhook_settings ADD COLUMN retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay": 5}'::jsonb;
  END IF;
END $$;