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
        url:='https://functions.craftlocal.net/send-abandoned-cart-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);