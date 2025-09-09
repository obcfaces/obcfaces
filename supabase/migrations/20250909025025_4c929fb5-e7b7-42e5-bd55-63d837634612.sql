-- Make the function truly public by setting it as security invoker
-- This means it runs with the privileges of the calling user (including anon)
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
RETURNS TABLE(participant_id uuid, user_id uuid, contest_id uuid, first_name text, last_name text, display_name text, age integer, country text, state text, city text, height_cm integer, weight_kg numeric, gender text, marital_status text, has_children boolean, photo_1_url text, photo_2_url text, avatar_url text, participant_type text, average_rating numeric, total_votes integer, final_rank integer, contest_start_date date, contest_end_date date, contest_title text, contest_status text)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Changed from DEFINER to INVOKER to allow public access
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
    COALESCE(wcp.application_data->>'first_name', p.first_name) as first_name,
    COALESCE(wcp.application_data->>'last_name', p.last_name) as last_name,
    p.display_name,
    -- Fix age calculation: current year minus birth year
    CASE 
      WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::INTEGER
      WHEN p.birthdate IS NOT NULL THEN 
        EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.birthdate)
      ELSE p.age
    END as age,
    COALESCE(wcp.application_data->>'country', p.country) as country,
    COALESCE(wcp.application_data->>'state', p.state) as state,
    COALESCE(wcp.application_data->>'city', p.city) as city,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, p.height_cm) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, p.weight_kg) as weight_kg,
    COALESCE(wcp.application_data->>'gender', p.gender) as gender,
    COALESCE(wcp.application_data->>'marital_status', p.marital_status) as marital_status,
    COALESCE((wcp.application_data->>'has_children')::BOOLEAN, p.has_children) as has_children,
    COALESCE(wcp.application_data->>'photo1_url', p.photo_1_url) as photo_1_url,
    COALESCE(wcp.application_data->>'photo2_url', p.photo_2_url) as photo_2_url,
    p.avatar_url,
    CASE 
      WHEN wcp.final_rank = 1 THEN 'winner'
      WHEN wcp.final_rank IS NOT NULL THEN 'finalist'
      ELSE COALESCE(p.participant_type, 'candidate')
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
  LEFT JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND EXISTS (
      SELECT 1 FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
      AND ca.status = 'approved'
      AND ca.is_active = true
      AND ca.deleted_at IS NULL  -- Exclude deleted applications
    )
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
$function$;