-- Update the function to properly handle specific week intervals and admin filtering
CREATE OR REPLACE FUNCTION public.get_weekly_participants_by_admin_status(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid, 
  user_id uuid, 
  contest_id uuid, 
  first_name text, 
  last_name text, 
  display_name text, 
  age integer, 
  country text, 
  state text, 
  city text, 
  height_cm integer, 
  weight_kg numeric, 
  gender text, 
  marital_status text, 
  has_children boolean, 
  photo_1_url text, 
  photo_2_url text, 
  avatar_url text, 
  participant_type text, 
  average_rating numeric, 
  total_votes integer, 
  final_rank integer, 
  contest_start_date date, 
  contest_end_date date, 
  contest_title text, 
  contest_status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH current_monday AS (
    SELECT 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN CURRENT_DATE - INTERVAL '6 days'
        ELSE CURRENT_DATE - INTERVAL '1 day' * (EXTRACT(DOW FROM CURRENT_DATE) - 1)
      END::DATE as monday
  ),
  target_monday AS (
    SELECT (monday + (weeks_offset * INTERVAL '7 days'))::DATE as target_week
    FROM current_monday
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
    wc.week_start_date as contest_start_date,
    wc.week_end_date as contest_end_date,
    wc.title as contest_title,
    wc.status as contest_status
  FROM weekly_contest_participants wcp
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  WHERE wcp.is_active = true
    AND (
      CASE 
        -- For current week (weeks_offset = 0), show participants who would have "this week" status in admin
        WHEN weeks_offset = 0 THEN (
          -- Get current Monday for comparison
          WITH curr_monday AS (
            SELECT 
              CASE 
                WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN CURRENT_DATE - INTERVAL '6 days'
                ELSE CURRENT_DATE - INTERVAL '1 day' * (EXTRACT(DOW FROM CURRENT_DATE) - 1)
              END::DATE as monday
          )
          SELECT (
            -- Include if they have final_rank (would default to "this week" in admin) 
            -- OR if they were created during current week
            wcp.final_rank IS NOT NULL OR
            (
              wc.week_start_date = (SELECT monday FROM curr_monday)
            )
          )
        )
        -- For past weeks (-1, -2, etc.), show finalists from those specific weeks
        ELSE (
          wcp.final_rank IS NOT NULL AND 
          wc.week_start_date = (SELECT target_week FROM target_monday)
        )
      END
    )
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
$function$;