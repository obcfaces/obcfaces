-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly transition to run every Monday at 00:01 UTC
SELECT cron.schedule(
  'weekly-contest-transition',
  '1 0 * * 1',  -- Every Monday at 00:01 UTC
  $$
  SELECT net.http_post(
    url := 'https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-transition',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Query to check scheduled jobs:
-- SELECT * FROM cron.job;