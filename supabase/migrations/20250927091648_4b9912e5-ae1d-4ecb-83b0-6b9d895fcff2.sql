-- Fix the contest selection to find the contest that actually has participants with the expected status
DROP FUNCTION IF EXISTS get_weekly_contest_participants_public;

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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH expected_status AS (
    SELECT 
      CASE 
        WHEN weeks_offset = 0 THEN 'this week'
        WHEN weeks_offset = 1 THEN 'next week'
        WHEN weeks_offset < 0 THEN 'past week'
        ELSE 'this week'
      END as status_filter
  ),
  target_contest AS (
    SELECT 
      wc.id,
      wc.title,
      wc.status,
      wc.week_start_date,
      wc.week_end_date
    FROM weekly_contests wc
    CROSS JOIN expected_status es
    WHERE EXISTS (
      SELECT 1 FROM weekly_contest_participants wcp 
      WHERE wcp.contest_id = wc.id 
        AND wcp.participant_status::text = es.status_filter
        AND wcp.is_active = true
    )
    ORDER BY wc.week_start_date DESC 
    LIMIT 1
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