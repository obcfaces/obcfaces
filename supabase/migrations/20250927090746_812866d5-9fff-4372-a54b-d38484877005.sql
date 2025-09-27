-- Fix the type mismatch in get_weekly_contest_participants_public function
DROP FUNCTION IF EXISTS get_weekly_contest_participants_public(weeks_offset INTEGER);

CREATE OR REPLACE FUNCTION get_weekly_contest_participants_public(weeks_offset INTEGER DEFAULT 0)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  contest_id UUID,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  age INTEGER,
  country TEXT,
  state TEXT,
  city TEXT,
  height_cm INTEGER,
  weight_kg NUMERIC,
  gender TEXT,
  marital_status TEXT,
  has_children BOOLEAN,
  photo_1_url TEXT,
  photo_2_url TEXT,
  avatar_url TEXT,
  participant_type TEXT,
  average_rating NUMERIC,
  total_votes INTEGER,
  final_rank INTEGER,
  contest_start_date DATE,
  contest_end_date DATE,
  contest_title TEXT,
  contest_status TEXT,
  participant_status TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  -- Define the expected participant status based on weeks_offset
  RETURN QUERY
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
        WHEN weeks_offset = 0 THEN 0     -- Current week
        WHEN weeks_offset = -1 THEN 3    -- 1 week ago
        WHEN weeks_offset = -2 THEN 4    -- 2 weeks ago
        WHEN weeks_offset = -3 THEN 5    -- 3 weeks ago
        ELSE ABS(weeks_offset) + 1
      END
      LIMIT 1
    )
  ),
  expected_status AS (
    SELECT 
      CASE 
        WHEN weeks_offset = 0 THEN 'this week'        -- Current week should show "this week" status
        WHEN weeks_offset = 1 THEN 'next week'        -- Next week should show "next week" status  
        WHEN weeks_offset < 0 THEN 'past week'        -- Past weeks should show "past week" status
        ELSE 'this week'
      END as status_filter
  )
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.contest_id,
    wcp.application_data->>'first_name' as first_name,
    wcp.application_data->>'last_name' as last_name,
    COALESCE(p.display_name, CONCAT(wcp.application_data->>'first_name', ' ', wcp.application_data->>'last_name')) as display_name,
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
    COALESCE(wcp.total_votes, 0)::INTEGER as total_votes,
    wcp.final_rank,
    tc.week_start_date as contest_start_date,
    tc.week_end_date as contest_end_date,
    tc.title as contest_title,
    tc.status as contest_status,
    COALESCE(wcp.participant_status::text, 'this week') as participant_status
  FROM target_contest tc
  JOIN weekly_contest_participants wcp ON wcp.contest_id = tc.id
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  CROSS JOIN expected_status es
  WHERE wcp.is_active = true
    AND wcp.participant_status::text = es.status_filter
  ORDER BY wcp.final_rank ASC NULLS LAST, wcp.average_rating DESC NULLS LAST;
END;
$$;