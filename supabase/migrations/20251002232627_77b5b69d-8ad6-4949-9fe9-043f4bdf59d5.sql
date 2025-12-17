-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- IMPORTANT: Manual Configuration Required
-- ============================================
-- After running this migration, you must manually set up the cron job
-- using your actual edge functions URL and anon key from environment variables.
--
-- To set up the cron job, run the following SQL in your Supabase SQL Editor,
-- replacing YOUR_FUNCTIONS_URL and YOUR_ANON_KEY with your actual values:
--
-- SELECT cron.schedule(
--   'send-daily-compliance-reminders',
--   '0 9 * * *',
--   $$
--   SELECT
--     net.http_post(
--         url:='YOUR_FUNCTIONS_URL/send-compliance-reminders',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--         body:='{"scheduled": true}'::jsonb
--     ) as request_id;
--   $$
-- );
--
-- To get your values:
-- - FUNCTIONS_URL: Your edge functions domain (e.g., https://functions.craftlocal.net)
-- - ANON_KEY: Your Supabase anon key from environment variables
-- ============================================

-- Create a helper function for admins to manually trigger compliance checks
CREATE OR REPLACE FUNCTION trigger_compliance_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can trigger this
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can trigger compliance checks';
  END IF;

  -- Call the compliance notification function
  PERFORM send_compliance_notifications();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Compliance notifications triggered successfully'
  );
END;
$$;