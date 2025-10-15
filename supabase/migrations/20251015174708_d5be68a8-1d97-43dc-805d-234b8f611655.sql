-- Remove old insecure cron job with hardcoded JWT
SELECT cron.unschedule('weekly-contest-transition');

-- Create secure cron job calling RPC directly (no HTTP, no secrets)
SELECT cron.schedule(
  'weekly-contest-transition',
  '1 0 * * 1',  -- Every Monday at 00:01 UTC
  $$
  SELECT public.transition_weekly_contest(
    public.get_current_monday_utc(),
    false  -- live run, not dry_run
  );
  $$
);