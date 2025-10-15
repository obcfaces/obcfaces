-- Remove old cron job with wrong function names
SELECT cron.unschedule('weekly-contest-transition');

-- Create correct cron job using existing transition_this_week shortcut
SELECT cron.schedule(
  'weekly-contest-transition',
  '1 0 * * 1',  -- Every Monday at 00:01 UTC
  $$ SELECT public.transition_this_week(false); $$
);