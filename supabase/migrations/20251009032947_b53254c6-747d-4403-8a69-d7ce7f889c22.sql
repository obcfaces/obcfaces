
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create backup metadata table
CREATE TABLE IF NOT EXISTS backup_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id text UNIQUE NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  tables text[] NOT NULL,
  total_records integer NOT NULL DEFAULT 0,
  retention_days integer NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Schedule daily backup at 3:00 AM Manila time (19:00 UTC)
SELECT cron.schedule(
  'daily-backup-job',
  '0 19 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://mlbzdxsumfudrtuuybqn.supabase.co/functions/v1/daily-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYnpkeHN1bWZ1ZHJ0dXV5YnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjUyMTQsImV4cCI6MjA3MDUwMTIxNH0._IFfwePqOwpwLOMXGtIEleFwd9BQ7zzKKoALTtk9qng"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
