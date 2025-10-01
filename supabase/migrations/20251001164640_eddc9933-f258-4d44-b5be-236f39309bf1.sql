-- Fix type casting for participant_admin_status enum in RPC functions

DROP FUNCTION IF EXISTS get_weekly_contest_participants_public(integer);
CREATE OR REPLACE FUNCTION get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
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
  display_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.first_name,
    wcp.last_name,
    wcp.age,
    wcp.country,
    wcp.state,
    wcp.city,
    wcp.height_cm,
    wcp.weight_kg,
    wcp.photo_1_url,
    wcp.photo_2_url,
    wcp.average_rating,
    COALESCE(wcp.total_votes, 0)::bigint as total_votes,
    wcp.final_rank,
    wcp.created_at,
    wcp.display_name
  FROM weekly_contest_participants wcp
  WHERE wcp.admin_status::text = 'this week'
    AND wcp.week_offset = weeks_offset 
    AND wcp.is_active = true
  ORDER BY wcp.final_rank ASC NULLS LAST;
END;
$$;

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
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    wcp.first_name,
    wcp.last_name,
    wcp.age,
    wcp.country,
    wcp.state,
    wcp.city,
    wcp.height_cm,
    wcp.weight_kg,
    wcp.photo_1_url,
    wcp.photo_2_url,
    wcp.average_rating,
    COALESCE(wcp.total_votes, 0)::bigint as total_votes,
    wcp.final_rank,
    wcp.created_at,
    wcp.display_name,
    wcp.contest_id,
    wcp.avatar_url,
    wcp.gender,
    wcp.marital_status,
    wcp.has_children,
    wcp.participant_type,
    wcp.contest_start_date,
    wcp.contest_end_date,
    wcp.contest_title,
    wcp.contest_status,
    wcp.application_data,
    wcp.phone_data,
    wcp.is_active,
    wcp.admin_status::text as admin_status
  FROM weekly_contest_participants wcp
  WHERE wcp.week_offset = weeks_offset
  ORDER BY wcp.final_rank ASC NULLS LAST;
END;
$$;