-- Remove the overly permissive public policy that exposes personal data
DROP POLICY IF EXISTS "Public can check approved applications status" ON public.contest_applications;

-- Modify the public function to not depend on contest_applications access
-- This version only returns data from weekly_contest_participants which is already filtered
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
RETURNS TABLE(participant_id uuid, user_id uuid, contest_id uuid, first_name text, last_name text, display_name text, age integer, country text, state text, city text, height_cm integer, weight_kg numeric, gender text, marital_status text, has_children boolean, photo_1_url text, photo_2_url text, avatar_url text, participant_type text, average_rating numeric, total_votes integer, final_rank integer, contest_start_date date, contest_end_date date, contest_title text, contest_status text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $function$
  WITH target_contest AS (
    SELECT 
      id,
      title,
      status,
      week_start_date,
      week_end_date
    FROM weekly_contests 
    WHERE week_start_date = (
      SELECT week_start_date 
      FROM weekly_contests 
      ORDER BY week_start_date DESC 
      OFFSET ABS(weeks_offset) 
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
    COALESCE(p.display_name, wcp.application_data->>'first_name' || ' ' || wcp.application_data->>'last_name') as display_name,
    -- Age calculation from birth year (less sensitive than full birthdate)
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
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
    wcp.application_data->>'photo1_url' as photo_1_url,
    wcp.application_data->>'photo2_url' as photo_2_url,
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
    tc.status as contest_status
  FROM target_contest tc
  JOIN weekly_contest_participants wcp ON wcp.contest_id = tc.id
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  WHERE wcp.is_active = true
    -- Only show participants that have been explicitly added to weekly contest
    -- This ensures they've gone through the approval process
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
$function$;