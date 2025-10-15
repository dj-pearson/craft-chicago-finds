-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule abandoned cart reminders to run daily at 10 AM
SELECT cron.schedule(
  'send-abandoned-cart-reminders',
  '0 10 * * *', -- Every day at 10 AM
  $$
  SELECT
    net.http_post(
        url:='https://slamtlgebisrimijeoid.supabase.co/functions/v1/send-abandoned-cart-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsYW10bGdlYmlzcmltaWplb2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjk4ODAsImV4cCI6MjA3NDY0NTg4MH0.qjGMY4uUdhDOGmgwlqZrjwTwbiPu4tSJOdSYLtgz0Fo"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);