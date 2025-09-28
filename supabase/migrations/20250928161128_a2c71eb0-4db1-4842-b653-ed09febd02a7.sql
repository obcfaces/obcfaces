-- Update cron job to call the new edge function
SELECT cron.unschedule('weekly-contest-transition-timezone');
SELECT cron.unschedule('weekly-status-transition');

-- Create new cron job to run weekly transition every Monday at 00:01 Philippine time (16:01 UTC previous day)
SELECT cron.schedule(
  'weekly-transition-function',
  '1 16 * * SUN', -- Sunday 16:01 UTC = Monday 00:01 Philippine time
  $$
  SELECT
    net.http_post(
        url:='https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-transition',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);