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
        url:='https://functions.craftlocal.net/send-compliance-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM"}'::jsonb,
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