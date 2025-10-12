-- =========================================
-- FIX WEEKLY CONTEST TRANSITION CRON JOB
-- =========================================

-- 1. DELETE OLD INCORRECT CRON JOBS
SELECT cron.unschedule('weekly-transition-function');
SELECT cron.unschedule('weekly-status-transition-monday');
SELECT cron.unschedule('weekly-status-transition-auto');

-- 2. CREATE NEW CORRECT CRON JOB
-- Runs every Monday at 00:00 UTC
-- Calls the correct edge function: weekly-contest-transition
SELECT cron.schedule(
  'weekly-contest-transition-monday',
  '0 0 * * 1', -- Every Monday at 00:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng"}'::jsonb,
        body:='{"trigger": "cron", "automatic": true}'::jsonb
    ) as request_id;
  $$
);

-- 3. VERIFY THE CRON JOB
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'weekly-contest-transition-monday';