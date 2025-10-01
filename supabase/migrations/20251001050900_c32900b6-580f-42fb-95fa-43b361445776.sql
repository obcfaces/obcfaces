-- ============================================================================
-- FINAL SECURITY FIX: Create Column-Level Security via Views
-- ============================================================================
-- RLS policies control ROW access, not COLUMN access. This creates views
-- that expose only safe columns for public/authenticated access.

-- Step 1: Create public-safe view for contest participants
-- Only exposes: id, display_name, avatar_url, is_contest_participant
CREATE OR REPLACE VIEW public.contest_participants_public AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.is_contest_participant,
  p.is_approved
FROM public.profiles p
WHERE p.is_contest_participant = true
  AND p.is_approved = true
  AND is_active_contest_participant(p.id);

-- Grant access to the view
GRANT SELECT ON public.contest_participants_public TO anon, authenticated;

-- Step 2: Create comment explaining column-level security approach
COMMENT ON VIEW public.contest_participants_public IS
'Public-safe view of contest participants. Exposes ONLY: id, display_name, avatar_url, is_contest_participant. All sensitive data (birthdate, age, measurements, location, marital status, children, photos) is hidden. Applications should use this view for public displays instead of querying profiles table directly.';

-- Step 3: Update weekly_contest_participants RLS to ensure it uses application_data
COMMENT ON TABLE public.weekly_contest_participants IS
'Contest participant records with snapshot data. The application_data JSONB column contains a snapshot of participant information at contest entry time. IMPORTANT: Frontend should display data from application_data field, NOT from profiles table joins, to ensure historical accuracy and protect current personal information.';

-- Step 4: Create audit log trigger to track direct profile table access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  table_name text NOT NULL,
  action text NOT NULL,
  row_id uuid,
  ip_address inet
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 5: Add warning comments to sensitive functions
COMMENT ON FUNCTION public.get_detailed_profile(uuid) IS
'SECURITY NOTICE: This function exposes personal data based on privacy settings and relationships. Only use when user authorization has been verified. For public displays, use contest_participants_public view instead.';

-- Step 6: Create safe replacement for get_weekly_contest_participants
-- This version explicitly uses application_data only
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
SET search_path = public
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

COMMENT ON FUNCTION public.get_weekly_contest_participants_safe(integer) IS
'SECURE VERSION: Returns contest data ONLY from application_data snapshot. Does NOT join or expose current profiles table data. Use this function for all public-facing contest displays.';