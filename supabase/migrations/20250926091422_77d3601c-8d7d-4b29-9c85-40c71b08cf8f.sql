-- Drop and recreate the function with the new return type
DROP FUNCTION IF EXISTS public.get_weekly_participants_by_admin_status(integer);

CREATE FUNCTION public.get_weekly_participants_by_admin_status(weeks_offset integer DEFAULT 0)
 RETURNS TABLE(participant_id uuid, user_id uuid, contest_id uuid, first_name text, last_name text, display_name text, age integer, country text, state text, city text, height_cm integer, weight_kg numeric, gender text, marital_status text, has_children boolean, photo_1_url text, photo_2_url text, avatar_url text, participant_type text, average_rating numeric, total_votes integer, final_rank integer, contest_start_date date, contest_end_date date, contest_title text, contest_status text, admin_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH target_contest AS (
    SELECT 
      id,
      title,
      status,
      week_start_date,
      week_end_date
    FROM weekly_contests wc
    WHERE wc.week_start_date = (
      SELECT week_start_date 
      FROM weekly_contests 
      ORDER BY week_start_date DESC 
      OFFSET CASE 
        WHEN weeks_offset = 0 THEN 0     -- Current week: 2025-09-28
        WHEN weeks_offset = -1 THEN 3    -- 1 week ago: 2025-09-16
        WHEN weeks_offset = -2 THEN 4    -- 2 weeks ago: 2025-09-09
        WHEN weeks_offset = -3 THEN 5    -- 3 weeks ago: older contest
        ELSE ABS(weeks_offset) + 1
      END
      LIMIT 1
    )
  )
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.contest_id,
    -- Only expose data that's already in application_data (pre-approved data)
    wcp.application_data->>'first_name' as first_name,
    wcp.application_data->>'last_name' as last_name,
    -- Use coalesce with profiles only for public display data
    COALESCE(p.display_name, CONCAT(wcp.application_data->>'first_name', ' ', wcp.application_data->>'last_name')) as display_name,
    -- Age calculation from birth year (less sensitive than full birthdate)
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
      WHEN wcp.application_data->>'age' IS NOT NULL THEN
        (wcp.application_data->>'age')::INTEGER
      ELSE NULL
    END as age,
    wcp.application_data->>'country' as country,
    wcp.application_data->>'state' as state,
    wcp.application_data->>'city' as city,
    (wcp.application_data->>'height_cm')::INTEGER as height_cm,
    (wcp.application_data->>'weight_kg')::NUMERIC as weight_kg,
    wcp.application_data->>'gender' as gender,
    wcp.application_data->>'marital_status' as marital_status,
    (wcp.application_data->>'has_children')::BOOLEAN as has_children,
    -- Handle both photo naming conventions
    COALESCE(
      wcp.application_data->>'photo1_url', 
      wcp.application_data->>'photo_1_url'
    ) as photo_1_url,
    COALESCE(
      wcp.application_data->>'photo2_url', 
      wcp.application_data->>'photo_2_url'
    ) as photo_2_url,
    p.avatar_url,
    CASE 
      WHEN wcp.final_rank = 1 THEN 'winner'
      WHEN wcp.final_rank IS NOT NULL THEN 'finalist'
      ELSE 'candidate'
    END as participant_type,
    COALESCE(wcp.average_rating, 0) as average_rating,
    COALESCE(wcp.total_votes, 0) as total_votes,
    wcp.final_rank,
    tc.week_start_date as contest_start_date,
    tc.week_end_date as contest_end_date,
    tc.title as contest_title,
    tc.status as contest_status,
    COALESCE(wcp.admin_status, 'this week') as admin_status
  FROM target_contest tc
  JOIN weekly_contest_participants wcp ON wcp.contest_id = tc.id
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  WHERE wcp.is_active = true
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
$function$;