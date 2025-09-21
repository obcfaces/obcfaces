-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to automatically transition weekly contests every Monday
CREATE OR REPLACE FUNCTION public.auto_transition_weekly_contests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_monday DATE;
  prev_monday DATE;
BEGIN
  -- Get current Monday and previous Monday
  current_monday := get_week_monday(CURRENT_DATE);
  prev_monday := current_monday - INTERVAL '7 days';
  
  -- Close previous week's contests
  UPDATE public.weekly_contests 
  SET status = 'closed', updated_at = NOW()
  WHERE week_start_date = prev_monday AND status = 'active';
  
  -- Ensure current week contest exists and is active
  PERFORM ensure_weekly_contest(current_monday);
  
  -- Log the transition
  RAISE NOTICE 'Weekly contest transition completed for week starting %', current_monday;
END;
$$;

-- Schedule the function to run every Monday at 00:01
SELECT cron.schedule(
  'weekly-contest-transition',
  '1 0 * * 1', -- Every Monday at 00:01
  $$SELECT public.auto_transition_weekly_contests();$$
);