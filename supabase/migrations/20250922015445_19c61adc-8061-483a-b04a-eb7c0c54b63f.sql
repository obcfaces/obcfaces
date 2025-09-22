-- Fix the remaining functions with missing search_path

-- Fix auto_transition_weekly_contests function
CREATE OR REPLACE FUNCTION public.auto_transition_weekly_contests()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  PERFORM create_weekly_contest(current_monday);
  
  -- Log the transition
  RAISE NOTICE 'Weekly contest transition completed for week starting %', current_monday;
END;
$function$;

-- Fix auto_transition_weekly_contests_with_timezone function  
CREATE OR REPLACE FUNCTION public.auto_transition_weekly_contests_with_timezone()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;