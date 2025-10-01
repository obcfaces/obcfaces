-- Fix get_weekly_contest_participants_admin to properly extract data from application_data JSONB

DROP FUNCTION IF EXISTS get_weekly_contest_participants_admin(integer);
CREATE OR REPLACE FUNCTION get_weekly_contest_participants_admin(weeks_offset integer DEFAULT 0)
RETURNS TABLE (
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  country text,
  state text,
  city text,
  height_cm integer,
  weight_kg integer,
  photo_1_url text,
  photo_2_url text,
  average_rating numeric,
  total_votes bigint,
  final_rank integer,
  created_at timestamp with time zone,
  display_name text,
  contest_id uuid,
  avatar_url text,
  gender text,
  marital_status text,
  has_children boolean,
  participant_type text,
  contest_start_date timestamp with time zone,
  contest_end_date timestamp with time zone,
  contest_title text,
  contest_status text,
  application_data jsonb,
  phone_data jsonb,
  is_active boolean,
  admin_status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When weeks_offset = 0, show participants with admin_status = 'this week'
  -- This matches the main site's THIS WEEK section
  IF weeks_offset = 0 THEN
    RETURN QUERY
    SELECT 
      wcp.id as participant_id,
      wcp.user_id,
      (wcp.application_data->>'first_name')::text as first_name,
      (wcp.application_data->>'last_name')::text as last_name,
      (wcp.application_data->>'age')::integer as age,
      (wcp.application_data->>'country')::text as country,
      (wcp.application_data->>'state')::text as state,
      (wcp.application_data->>'city')::text as city,
      (wcp.application_data->>'height_cm')::integer as height_cm,
      (wcp.application_data->>'weight_kg')::integer as weight_kg,
      (wcp.application_data->>'photo1_url')::text as photo_1_url,
      (wcp.application_data->>'photo2_url')::text as photo_2_url,
      wcp.average_rating,
      COALESCE(wcp.total_votes, 0)::bigint as total_votes,
      wcp.final_rank,
      wcp.created_at,
      (wcp.application_data->>'display_name')::text as display_name,
      wcp.contest_id,
      (wcp.application_data->>'avatar_url')::text as avatar_url,
      (wcp.application_data->>'gender')::text as gender,
      (wcp.application_data->>'marital_status')::text as marital_status,
      (wcp.application_data->>'has_children')::boolean as has_children,
      (wcp.application_data->>'participant_type')::text as participant_type,
      wcp.created_at as contest_start_date,
      wcp.created_at as contest_end_date,
      'Current Contest'::text as contest_title,
      'active'::text as contest_status,
      wcp.application_data,
      wcp.application_data as phone_data,
      wcp.is_active,
      wcp.admin_status::text as admin_status
    FROM weekly_contest_participants wcp
    WHERE wcp.admin_status::text = 'this week'
      AND wcp.is_active = true
    ORDER BY wcp.created_at DESC;
  ELSE
    -- For other week offsets, use week_offset column
    RETURN QUERY
    SELECT 
      wcp.id as participant_id,
      wcp.user_id,
      (wcp.application_data->>'first_name')::text as first_name,
      (wcp.application_data->>'last_name')::text as last_name,
      (wcp.application_data->>'age')::integer as age,
      (wcp.application_data->>'country')::text as country,
      (wcp.application_data->>'state')::text as state,
      (wcp.application_data->>'city')::text as city,
      (wcp.application_data->>'height_cm')::integer as height_cm,
      (wcp.application_data->>'weight_kg')::integer as weight_kg,
      (wcp.application_data->>'photo1_url')::text as photo_1_url,
      (wcp.application_data->>'photo2_url')::text as photo_2_url,
      wcp.average_rating,
      COALESCE(wcp.total_votes, 0)::bigint as total_votes,
      wcp.final_rank,
      wcp.created_at,
      (wcp.application_data->>'display_name')::text as display_name,
      wcp.contest_id,
      (wcp.application_data->>'avatar_url')::text as avatar_url,
      (wcp.application_data->>'gender')::text as gender,
      (wcp.application_data->>'marital_status')::text as marital_status,
      (wcp.application_data->>'has_children')::boolean as has_children,
      (wcp.application_data->>'participant_type')::text as participant_type,
      wcp.created_at as contest_start_date,
      wcp.created_at as contest_end_date,
      'Past Contest'::text as contest_title,
      'closed'::text as contest_status,
      wcp.application_data,
      wcp.application_data as phone_data,
      wcp.is_active,
      wcp.admin_status::text as admin_status
    FROM weekly_contest_participants wcp
    WHERE wcp.week_offset = weeks_offset
    ORDER BY wcp.final_rank ASC NULLS LAST;
  END IF;
END;
$$;