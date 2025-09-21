-- Function to get the primary timezone based on current week's participants
CREATE OR REPLACE FUNCTION public.get_primary_participant_timezone()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  primary_country text;
  timezone_name text;
  current_monday date;
BEGIN
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Get the most common country among current week's participants
  SELECT country INTO primary_country
  FROM (
    SELECT 
      wcp.application_data->>'country' as country,
      COUNT(*) as participant_count
    FROM weekly_contest_participants wcp
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    WHERE wc.week_start_date = current_monday
      AND wcp.is_active = true
      AND wcp.application_data->>'country' IS NOT NULL
    GROUP BY wcp.application_data->>'country'
    ORDER BY participant_count DESC
    LIMIT 1
  ) country_stats;
  
  -- Map countries to timezones (add more as needed)
  timezone_name := CASE 
    WHEN primary_country = 'PH' OR primary_country = 'Philippines' THEN 'Asia/Manila'
    WHEN primary_country = 'RU' OR primary_country = 'Russia' THEN 'Europe/Moscow'
    WHEN primary_country = 'UA' OR primary_country = 'Ukraine' THEN 'Europe/Kiev'
    WHEN primary_country = 'BY' OR primary_country = 'Belarus' THEN 'Europe/Minsk'
    WHEN primary_country = 'US' OR primary_country = 'United States' THEN 'America/New_York'
    WHEN primary_country = 'GB' OR primary_country = 'United Kingdom' THEN 'Europe/London'
    WHEN primary_country = 'DE' OR primary_country = 'Germany' THEN 'Europe/Berlin'
    WHEN primary_country = 'FR' OR primary_country = 'France' THEN 'Europe/Paris'
    -- Default to UTC if country not mapped
    ELSE 'UTC'
  END;
  
  RETURN COALESCE(timezone_name, 'UTC');
END;
$$;

-- Enhanced function to automatically transition weekly contests with timezone awareness
CREATE OR REPLACE FUNCTION public.auto_transition_weekly_contests_with_timezone()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_monday DATE;
  prev_monday DATE;
  participant_timezone text;
  current_time_in_tz timestamp with time zone;
  transition_time_utc time;
BEGIN
  -- Get the primary timezone of current participants
  participant_timezone := get_primary_participant_timezone();
  
  -- Get current time in participant timezone
  current_time_in_tz := now() AT TIME ZONE participant_timezone;
  
  -- Only proceed if it's Monday and after midnight in participant timezone
  IF EXTRACT(DOW FROM current_time_in_tz) = 1 AND EXTRACT(HOUR FROM current_time_in_tz) >= 0 THEN
    current_monday := get_week_monday(CURRENT_DATE);
    prev_monday := current_monday - INTERVAL '7 days';
    
    -- Close previous week's contests
    UPDATE public.weekly_contests 
    SET status = 'closed', updated_at = NOW()
    WHERE week_start_date = prev_monday AND status = 'active';
    
    -- Ensure current week contest exists and is active
    PERFORM create_weekly_contest(current_monday);
    
    -- Log the transition with timezone info
    RAISE NOTICE 'Weekly contest transition completed for week starting % (Timezone: %)', 
      current_monday, participant_timezone;
  END IF;
END;
$$;

-- Remove old cron job
SELECT cron.unschedule('weekly-contest-transition');

-- Schedule new timezone-aware function to run every hour on Monday
-- This allows checking for the right time in participant timezone
SELECT cron.schedule(
  'weekly-contest-transition-timezone',
  '0 * * * 1', -- Every hour on Monday
  $$SELECT public.auto_transition_weekly_contests_with_timezone();$$
);