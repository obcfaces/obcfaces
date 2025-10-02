-- Drop old RPC functions
DROP FUNCTION IF EXISTS get_weekly_contest_participants_public(integer);
DROP FUNCTION IF EXISTS get_weekly_contest_participants_admin(integer);

-- Create new public RPC function for contest display
CREATE OR REPLACE FUNCTION get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  state text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  final_rank integer,
  average_rating numeric,
  total_votes integer,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target_week AS (
    SELECT get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days') as week_start
  )
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    (wcp.application_data->>'first_name')::text as first_name,
    (wcp.application_data->>'last_name')::text as last_name,
    (date_part('year', now()) - (wcp.application_data->>'birth_year')::integer)::integer as age,
    (wcp.application_data->>'city')::text as city,
    CASE 
      WHEN wcp.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (wcp.application_data->>'country')::text
    END as country,
    (wcp.application_data->>'state')::text as state,
    (wcp.application_data->>'photo1_url')::text as photo_1_url,
    (wcp.application_data->>'photo2_url')::text as photo_2_url,
    (wcp.application_data->>'height_cm')::integer as height_cm,
    (wcp.application_data->>'weight_kg')::numeric as weight_kg,
    wcp.final_rank,
    wcp.average_rating,
    wcp.total_votes,
    wcp.created_at
  FROM weekly_contest_participants wcp
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  CROSS JOIN target_week tw
  WHERE wc.week_start_date = tw.week_start
    AND wcp.admin_status = 'this week'
    AND wcp.is_active = true
    AND wcp.deleted_at IS NULL
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;

-- Create new admin RPC function with all statuses
CREATE OR REPLACE FUNCTION get_weekly_contest_participants_admin(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  contest_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  state text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  final_rank integer,
  average_rating numeric,
  total_votes integer,
  admin_status text,
  is_active boolean,
  week_interval text,
  created_at timestamp with time zone,
  application_data jsonb,
  gender text,
  marital_status text,
  has_children boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target_week AS (
    SELECT get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days') as week_start
  )
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.contest_id,
    (wcp.application_data->>'first_name')::text as first_name,
    (wcp.application_data->>'last_name')::text as last_name,
    (date_part('year', now()) - (wcp.application_data->>'birth_year')::integer)::integer as age,
    (wcp.application_data->>'city')::text as city,
    CASE 
      WHEN wcp.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (wcp.application_data->>'country')::text
    END as country,
    (wcp.application_data->>'state')::text as state,
    COALESCE((wcp.application_data->>'photo1_url')::text, (wcp.application_data->>'photo_1_url')::text) as photo_1_url,
    COALESCE((wcp.application_data->>'photo2_url')::text, (wcp.application_data->>'photo_2_url')::text) as photo_2_url,
    (wcp.application_data->>'height_cm')::integer as height_cm,
    (wcp.application_data->>'weight_kg')::numeric as weight_kg,
    wcp.final_rank,
    wcp.average_rating,
    wcp.total_votes,
    wcp.admin_status::text,
    wcp.is_active,
    wcp.week_interval,
    wcp.created_at,
    wcp.application_data,
    (wcp.application_data->>'gender')::text as gender,
    (wcp.application_data->>'marital_status')::text as marital_status,
    (wcp.application_data->>'has_children')::boolean as has_children
  FROM weekly_contest_participants wcp
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  CROSS JOIN target_week tw
  WHERE wc.week_start_date = tw.week_start
    AND wcp.deleted_at IS NULL
  ORDER BY 
    CASE wcp.admin_status
      WHEN 'this week' THEN 1
      WHEN 'next week on site' THEN 2
      WHEN 'next week' THEN 3
      WHEN 'pre next week' THEN 4
      WHEN 'approved' THEN 5
      WHEN 'under_review' THEN 6
      WHEN 'pending' THEN 7
      WHEN 'rejected' THEN 8
      WHEN 'past' THEN 9
      ELSE 10
    END,
    COALESCE(wcp.final_rank, 999),
    wcp.created_at;
$$;