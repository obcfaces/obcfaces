-- ============================================================================
-- FIX: Remove SECURITY DEFINER from View and Fix Search Paths
-- ============================================================================

-- Step 1: Recreate view without SECURITY DEFINER
-- The view should rely on RLS policies instead
DROP VIEW IF EXISTS public.contest_participants_public;

CREATE VIEW public.contest_participants_public 
WITH (security_invoker=true)
AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.is_contest_participant
FROM public.profiles p
WHERE p.is_contest_participant = true
  AND p.is_approved = true
  AND is_active_contest_participant(p.id);

-- Grant access
GRANT SELECT ON public.contest_participants_public TO anon, authenticated;

COMMENT ON VIEW public.contest_participants_public IS
'Public-safe view of contest participants using SECURITY INVOKER. Exposes ONLY: id, display_name, avatar_url, is_contest_participant. Relies on RLS policies for access control. All sensitive data hidden.';

-- Step 2: Fix search_path for get_safe_contestant_info function
CREATE OR REPLACE FUNCTION public.get_safe_contestant_info(contestant_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  is_contest_participant boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.is_contest_participant
  FROM public.profiles p
  WHERE p.id = contestant_user_id
    AND p.is_contest_participant = true
    AND p.is_approved = true
    AND is_active_contest_participant(p.id);
$$;

-- Step 3: Fix search_path for get_weekly_contest_participants_safe
CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_safe(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  photo1_url text,
  photo2_url text,
  height_cm integer,
  weight_kg numeric,
  final_rank integer,
  total_votes integer,
  average_rating numeric,
  contest_status text,
  week_start_date date,
  week_end_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT 
    wcp.id,
    wcp.user_id,
    (wcp.application_data->>'first_name')::text as first_name,
    (wcp.application_data->>'last_name')::text as last_name,
    (EXTRACT(YEAR FROM CURRENT_DATE) - (wcp.application_data->>'birth_year')::integer)::integer as age,
    (wcp.application_data->>'city')::text as city,
    CASE 
      WHEN wcp.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (wcp.application_data->>'country')::text
    END as country,
    (wcp.application_data->>'photo1_url')::text as photo1_url,
    (wcp.application_data->>'photo2_url')::text as photo2_url,
    (wcp.application_data->>'height_cm')::integer as height_cm,
    (wcp.application_data->>'weight_kg')::numeric as weight_kg,
    wcp.final_rank,
    COALESCE(wcp.total_votes, 0) as total_votes,
    COALESCE(wcp.average_rating, 0) as average_rating,
    wc.status as contest_status,
    wc.week_start_date,
    wc.week_end_date
  FROM public.weekly_contest_participants wcp
  JOIN public.weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.week_start_date = get_week_monday(CURRENT_DATE) + (weeks_offset * INTERVAL '7 days')
    AND wcp.is_active = true
  ORDER BY COALESCE(wcp.final_rank, 999), COALESCE(wcp.average_rating, 0) DESC;
$$;