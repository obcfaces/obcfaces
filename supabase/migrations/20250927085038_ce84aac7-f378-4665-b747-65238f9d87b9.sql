-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run participant status transitions every Monday at 00:01 UTC
SELECT cron.schedule(
  'auto-transition-participant-status',
  '1 0 * * 1', -- Every Monday at 00:01 UTC
  $$
  SELECT
    net.http_post(
        url:='https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/auto-transition-participant-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng"}'::jsonb,
        body:='{"triggered_by": "cron_job"}'::jsonb
    ) as request_id;
  $$
);