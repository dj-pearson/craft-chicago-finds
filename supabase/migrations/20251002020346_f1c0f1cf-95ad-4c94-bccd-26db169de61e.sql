-- Fix FK to allow deleting webhook_settings rows referenced by campaign_automation
ALTER TABLE public.campaign_automation
  DROP CONSTRAINT IF EXISTS campaign_automation_webhook_settings_id_fkey;

ALTER TABLE public.campaign_automation
  ADD CONSTRAINT campaign_automation_webhook_settings_id_fkey
  FOREIGN KEY (webhook_settings_id)
  REFERENCES public.webhook_settings(id)
  ON DELETE SET NULL;