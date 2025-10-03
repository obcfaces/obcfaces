-- Optimize RPC functions to fetch data directly from profiles table instead of application_data JSONB
-- This eliminates data duplication and improves query performance

-- Drop old functions
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_public(integer);
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_admin(integer);
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_next(integer);

-- Recreate get_weekly_contest_participants_public with direct profile joins
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_public(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  age integer,
  city text,
  state text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  final_rank integer,
  total_votes integer,
  average_rating numeric,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.age,
    p.city,
    p.state,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    wcp.final_rank,
    wcp.total_votes,
    wcp.average_rating,
    wcp.created_at
  FROM public.weekly_contest_participants wcp
  JOIN public.profiles p ON p.id = wcp.user_id
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
    AND wcp.is_active = true
    AND wcp.deleted_at IS NULL
    AND p.is_approved = true
    AND wcp.admin_status IN ('this week', 'next week', 'next week on site', 'past')
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;

-- Recreate get_weekly_contest_participants_admin with direct profile joins
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_admin(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid,
  contest_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  age integer,
  city text,
  state text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  gender text,
  marital_status text,
  has_children boolean,
  final_rank integer,
  total_votes integer,
  average_rating numeric,
  admin_status text,
  is_active boolean,
  created_at timestamp with time zone,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  deleted_at timestamp with time zone,
  week_interval text,
  notes text,
  application_data jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wcp.id as participant_id,
    wcp.contest_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.age,
    p.city,
    p.state,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    p.gender,
    p.marital_status,
    p.has_children,
    wcp.final_rank,
    wcp.total_votes,
    wcp.average_rating,
    wcp.admin_status::text,
    wcp.is_active,
    wcp.created_at,
    wcp.submitted_at,
    wcp.reviewed_at,
    wcp.reviewed_by,
    wcp.deleted_at,
    wcp.week_interval,
    wcp.notes,
    wcp.application_data
  FROM public.weekly_contest_participants wcp
  JOIN public.profiles p ON p.id = wcp.user_id
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
  ORDER BY COALESCE(wcp.final_rank, 999), wcp.created_at;
$$;

-- Recreate get_weekly_contest_participants_next with direct profile joins
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_next(week_offset integer DEFAULT 1)
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  age integer,
  city text,
  state text,
  country text,
  photo_1_url text,
  photo_2_url text,
  height_cm integer,
  weight_kg numeric,
  final_rank integer,
  total_votes integer,
  average_rating numeric,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.display_name,
    p.age,
    p.city,
    p.state,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    wcp.final_rank,
    wcp.total_votes,
    wcp.average_rating,
    wcp.created_at
  FROM public.weekly_contest_participants wcp
  JOIN public.profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status = 'next week'
    AND p.is_approved = true
    AND wcp.deleted_at IS NULL
  ORDER BY wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
$$;

COMMENT ON FUNCTION public.get_weekly_contest_participants_public IS 'Optimized to fetch data from profiles table, eliminating application_data duplication';
COMMENT ON FUNCTION public.get_weekly_contest_participants_admin IS 'Optimized to fetch data from profiles table, keeping application_data for backward compatibility';
COMMENT ON FUNCTION public.get_weekly_contest_participants_next IS 'Optimized to fetch data from profiles table for next week participants';