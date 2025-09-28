-- Fix get_weekly_contest_participants_public to show participants by status, not contest
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
 RETURNS TABLE(participant_id uuid, user_id uuid, contest_id uuid, first_name text, last_name text, display_name text, age integer, country text, state text, city text, height_cm integer, weight_kg numeric, gender text, marital_status text, has_children boolean, photo_1_url text, photo_2_url text, avatar_url text, participant_type text, average_rating numeric, total_votes integer, final_rank integer, contest_start_date date, contest_end_date date, contest_title text, contest_status text, participant_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_week_start DATE;
  current_day_of_week INTEGER;
  is_new_week BOOLEAN;
  participant_timezone TEXT;
  current_time_in_tz TIMESTAMP WITH TIME ZONE;
  expected_admin_status TEXT;
BEGIN
  -- Get the primary timezone of participants
  participant_timezone := get_primary_participant_timezone();
  
  -- Get current time in participant timezone
  current_time_in_tz := now() AT TIME ZONE participant_timezone;
  
  -- Calculate target week start date based on offset
  target_week_start := get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days');
  
  -- Get current day of week in participant timezone (1=Monday, 7=Sunday)
  current_day_of_week := EXTRACT(DOW FROM current_time_in_tz);
  -- Adjust for ISO week (Monday=1, Sunday=7)
  IF current_day_of_week = 0 THEN
    current_day_of_week := 7;
  END IF;
  
  -- Check if we're in a new week (Monday or later) in participant timezone
  is_new_week := (current_day_of_week = 1); -- Only on Monday
  
  -- Determine which admin status to show based on weeks_offset
  CASE 
    WHEN weeks_offset = 0 THEN expected_admin_status := 'this week';
    WHEN weeks_offset = 1 THEN 
      -- For next week, only show if it's Monday or future weeks
      IF is_new_week OR weeks_offset > 1 THEN
        expected_admin_status := 'next week on site,next week';
      ELSE
        expected_admin_status := 'none'; -- Hide until Monday
      END IF;
    WHEN weeks_offset = -1 THEN expected_admin_status := 'past week 1';
    WHEN weeks_offset = -2 THEN expected_admin_status := 'past week 2';
    WHEN weeks_offset < -2 THEN expected_admin_status := 'past';
    ELSE expected_admin_status := 'none';
  END CASE;
  
  -- If no status to show, return empty
  IF expected_admin_status = 'none' THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.contest_id,
    COALESCE(wcp.application_data->>'first_name', '') as first_name,
    COALESCE(wcp.application_data->>'last_name', '') as last_name,
    COALESCE(p.display_name, CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', ''))) as display_name,
    COALESCE(
      CASE 
        WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
          EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - (wcp.application_data->>'birth_year')::INTEGER
        WHEN wcp.application_data->>'age' IS NOT NULL THEN
          (wcp.application_data->>'age')::INTEGER
        ELSE NULL
      END, 0
    ) as age,
    COALESCE(wcp.application_data->>'country', '') as country,
    COALESCE(wcp.application_data->>'state', '') as state,
    COALESCE(wcp.application_data->>'city', '') as city,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, 0) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, 0) as weight_kg,
    COALESCE(wcp.application_data->>'gender', '') as gender,
    COALESCE(wcp.application_data->>'marital_status', '') as marital_status,
    COALESCE((wcp.application_data->>'has_children')::BOOLEAN, false) as has_children,
    COALESCE(
      wcp.application_data->>'photo1_url', 
      wcp.application_data->>'photo_1_url',
      ''
    ) as photo_1_url,
    COALESCE(
      wcp.application_data->>'photo2_url', 
      wcp.application_data->>'photo_2_url',
      ''
    ) as photo_2_url,
    COALESCE(p.avatar_url, '') as avatar_url,
    CASE 
      WHEN wcp.final_rank = 1 THEN 'winner'
      WHEN wcp.final_rank IS NOT NULL THEN 'finalist'
      ELSE 'candidate'
    END as participant_type,
    COALESCE(wcp.average_rating, 0::NUMERIC) as average_rating,
    COALESCE(wcp.total_votes, 0) as total_votes,
    wcp.final_rank,
    wc.week_start_date as contest_start_date,
    wc.week_end_date as contest_end_date,
    COALESCE(wc.title, '') as contest_title,
    COALESCE(wc.status, '') as contest_status,
    COALESCE(wcp.admin_status, 'this week') as participant_status
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  LEFT JOIN weekly_contests wc ON wc.id = wcp.contest_id
  WHERE wcp.is_active = true
    AND (
      -- Handle multiple statuses for next week
      CASE 
        WHEN expected_admin_status = 'next week on site,next week' THEN 
          wcp.admin_status IN ('next week on site', 'next week')
        ELSE 
          wcp.admin_status = expected_admin_status
      END
    )
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    )
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
END;
$function$;