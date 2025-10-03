-- ============================================
-- COMPLIANCE SYSTEM CRON JOB SETUP
-- ============================================
-- This script sets up automated daily compliance reminders
-- Run this in your Supabase SQL Editor after deployment
-- ============================================

-- Step 1: Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Schedule daily compliance reminders
-- Runs every day at 9:00 AM UTC
-- Adjust the time as needed for your timezone
SELECT cron.schedule(
  'daily-compliance-reminders',
  '0 9 * * *', -- Cron format: minute hour day month weekday
  $$
  SELECT
    net.http_post(
        url:='https://slamtlgebisrimijeoid.supabase.co/functions/v1/send-compliance-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsYW10bGdlYmlzcmltaWplb2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjk4ODAsImV4cCI6MjA3NDY0NTg4MH0.qjGMY4uWdhDOGmgwlqZrjwTwbiPu4tSJOdSYLtgz0Fo"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Step 3: Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-compliance-reminders';

-- Step 4: View cron job execution history (after it runs)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-compliance-reminders')
ORDER BY start_time DESC 
LIMIT 10;

-- ============================================
-- OPTIONAL: Manual Testing
-- ============================================
-- To test the compliance reminders immediately, run this:
-- (This will send emails to sellers who need compliance actions)

/*
SELECT
  net.http_post(
      url:='https://slamtlgebisrimijeoid.supabase.co/functions/v1/send-compliance-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsYW10bGdlYmlzcmltaWplb2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjk4ODAsImV4cCI6MjA3NDY0NTg4MH0.qjGMY4uWdhDOGmgwlqZrjwTwbiPu4tSJOdSYLtgz0Fo"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
*/

-- ============================================
-- CRON SCHEDULE EXAMPLES
-- ============================================
-- Every day at 9 AM UTC:        '0 9 * * *'
-- Every day at 6 PM UTC:        '0 18 * * *'
-- Twice daily (9 AM and 6 PM):  '0 9,18 * * *'
-- Every Monday at 9 AM:         '0 9 * * 1'
-- Every 6 hours:                '0 */6 * * *'
-- First day of month at 9 AM:   '0 9 1 * *'

-- ============================================
-- MANAGEMENT COMMANDS
-- ============================================

-- To delete the cron job (if needed):
-- SELECT cron.unschedule('daily-compliance-reminders');

-- To update the schedule (delete and recreate):
-- SELECT cron.unschedule('daily-compliance-reminders');
-- Then run the SELECT cron.schedule(...) command above with new time

-- ============================================
-- NOTES
-- ============================================
-- 1. The cron job requires pg_cron and pg_net extensions
-- 2. The job runs with the database's privileges
-- 3. All times are in UTC - adjust for your local timezone
-- 4. Check cron.job_run_details for execution logs
-- 5. The edge function handles rate limiting (24hr between reminders)
-- 6. Emails are sent via Resend - ensure RESEND_API_KEY is configured
-- ============================================
