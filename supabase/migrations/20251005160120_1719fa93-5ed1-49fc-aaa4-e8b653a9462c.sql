
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run weekly-status-transition function every Monday at 00:05 Manila time (which is Sunday 16:05 UTC)
-- Manila is UTC+8, so Monday 00:05 in Manila = Sunday 16:05 UTC
SELECT cron.schedule(
  'weekly-status-transition-monday',
  '5 16 * * 0', -- Every Sunday at 16:05 UTC (Monday 00:05 Manila time)
  $$
  SELECT net.http_post(
    url:='https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/weekly-status-transition',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
