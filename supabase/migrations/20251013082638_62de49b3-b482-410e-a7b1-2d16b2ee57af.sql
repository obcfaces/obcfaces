-- Enable required extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule weekly transition every Monday at 00:00 Asia/Makassar (which is 16:00 UTC on Sunday)
-- Asia/Makassar is UTC+8, so Monday 00:00 WITA = Sunday 16:00 UTC
SELECT cron.schedule(
  'weekly-contest-transition',
  '0 16 * * 0', -- Every Sunday at 16:00 UTC (Monday 00:00 WITA)
  $$
  SELECT
    net.http_post(
        url:='https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-contest-transition',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- View scheduled jobs
-- SELECT * FROM cron.job;