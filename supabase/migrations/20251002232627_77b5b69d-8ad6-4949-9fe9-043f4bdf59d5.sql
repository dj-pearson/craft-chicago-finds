-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily compliance reminders at 9 AM UTC
SELECT cron.schedule(
  'send-daily-compliance-reminders',
  '0 9 * * *', -- Every day at 9 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://slamtlgebisrimijeoid.supabase.co/functions/v1/send-compliance-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsYW10bGdlYmlzcmltaWplb2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjk4ODAsImV4cCI6MjA3NDY0NTg4MH0.qjGMY4uUdhDOGmgwlqZrjwTwbiPu4tSJOdSYLtgz0Fo"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

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