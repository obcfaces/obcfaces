-- Update the function to show next week participants only starting from Monday
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
BEGIN
  -- Calculate target week start date based on offset
  target_week_start := get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days');
  
  -- Get current day of week (1=Monday, 7=Sunday)
  current_day_of_week := EXTRACT(DOW FROM CURRENT_DATE);
  -- Adjust for ISO week (Monday=1, Sunday=7)
  IF current_day_of_week = 0 THEN
    current_day_of_week := 7;
  END IF;
  
  -- Check if we're in a new week (Monday or later)
  is_new_week := (current_day_of_week = 1); -- Only on Monday
  
  RETURN QUERY
  WITH expected_status AS (
    SELECT 
      CASE 
        WHEN weeks_offset = 0 THEN 'this week'
        WHEN weeks_offset = 1 THEN 'next week'
        WHEN weeks_offset = -1 THEN 'past week 1'
        WHEN weeks_offset = -2 THEN 'past week 2'
        WHEN weeks_offset < -2 THEN 'past'
        ELSE 'this week'
      END as status_filter,
      target_week_start as target_week,
      is_new_week as show_next_week_participants
  ),
  target_contests AS (
    SELECT 
      wc.id,
      wc.title,
      wc.status,
      wc.week_start_date,
      wc.week_end_date
    FROM weekly_contests wc
    WHERE wc.week_start_date = target_week_start
  )
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
    tc.week_start_date as contest_start_date,
    tc.week_end_date as contest_end_date,
    COALESCE(tc.title, '') as contest_title,
    COALESCE(tc.status, '') as contest_status,
    COALESCE(wcp.admin_status, wcp.participant_status::text, 'this week') as participant_status
  FROM target_contests tc
  JOIN weekly_contest_participants wcp ON wcp.contest_id = tc.id
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  CROSS JOIN expected_status es
  WHERE wcp.is_active = true
    AND (
      -- For "this week": show participants with admin_status = 'this week'
      (es.status_filter = 'this week' AND wcp.admin_status = 'this week') OR
      
      -- For "next week": show participants with admin_status = 'next week' or 'next week on site'
      -- BUT only if it's Monday or we're looking at future weeks
      (es.status_filter = 'next week' AND 
       wcp.admin_status IN ('next week', 'next week on site') AND
       (es.show_next_week_participants = true OR weeks_offset > 1)) OR
      
      -- For past weeks: show participants with matching past week status
      (es.status_filter = 'past week 1' AND wcp.admin_status = 'past week 1') OR
      (es.status_filter = 'past week 2' AND wcp.admin_status = 'past week 2') OR
      (es.status_filter = 'past' AND wcp.admin_status = 'past')
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
$function$