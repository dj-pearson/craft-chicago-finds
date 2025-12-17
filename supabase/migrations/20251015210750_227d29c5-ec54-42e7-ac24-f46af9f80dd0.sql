-- Enable pg_cron extension for scheduling
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
--   'send-abandoned-cart-reminders',
--   '0 10 * * *',
--   $$
--   SELECT
--     net.http_post(
--         url:='YOUR_FUNCTIONS_URL/send-abandoned-cart-reminder',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--         body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );
--
-- To get your values:
-- - FUNCTIONS_URL: Your edge functions domain (e.g., https://functions.craftlocal.net)
-- - ANON_KEY: Your Supabase anon key from environment variables
-- ============================================