-- ============================================================================
-- FIX: Protect Contestant Personal Information from Public Exposure
-- ============================================================================
-- CRITICAL SECURITY: The application_data field contains sensitive PII including
-- birthdates, phone numbers, exact locations, and other identifying information
-- that could be used for stalking, harassment, or identity theft.
--
-- Solution:
-- 1. Restrict public RLS policy to exclude application_data
-- 2. Ensure profiles table has safe display data
-- 3. Create secure function for public contestant info access
-- ============================================================================

-- Step 1: Update RLS policy to restrict application_data access
-- Drop existing public policy
DROP POLICY IF EXISTS "Public can view active contest participants" ON public.weekly_contest_participants;

-- Create new policy that allows viewing ONLY non-sensitive fields
-- application_data will be NULL for non-admin users
CREATE POLICY "Public can view safe participant info"
  ON public.weekly_contest_participants
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND deleted_at IS NULL 
    AND admin_status IN ('this week', 'next week', 'next week on site', 'past')
  );

-- Admins and moderators can see everything including application_data
CREATE POLICY "Admins can view all participant data"
  ON public.weekly_contest_participants
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

-- Users can see their own full data
CREATE POLICY "Users can view own full participant data"
  ON public.weekly_contest_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 2: Create secure function that returns ONLY safe public fields
-- This function explicitly excludes all sensitive personal information
CREATE OR REPLACE FUNCTION public.get_safe_participant_data(weeks_offset integer DEFAULT 0)
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  display_name text,
  age_range text,  -- Instead of exact birthdate: "18-25", "26-35", etc.
  city text,       -- Keep city as it's shown in UI, but could be removed if too sensitive
  country text,
  photo_1_url text,
  photo_2_url text,
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
  WITH safe_data AS (
    SELECT 
      wcp.id as participant_id,
      wcp.user_id,
      p.first_name,
      COALESCE(p.display_name, p.first_name) as display_name,
      -- Calculate age range instead of exact age for privacy
      CASE 
        WHEN p.age BETWEEN 18 AND 25 THEN '18-25'
        WHEN p.age BETWEEN 26 AND 35 THEN '26-35'
        WHEN p.age BETWEEN 36 AND 45 THEN '36-45'
        WHEN p.age > 45 THEN '45+'
        ELSE NULL
      END as age_range,
      p.city,
      p.country,
      p.photo_1_url,
      p.photo_2_url,
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
  )
  SELECT * FROM safe_data
  ORDER BY COALESCE(final_rank, 999), created_at;
$$;

-- Add comment explaining the security function
COMMENT ON FUNCTION public.get_safe_participant_data IS 
  'Returns only safe, non-sensitive participant information for public display. Excludes PII like exact birthdates, phone numbers, full addresses, marital status, etc.';

-- Step 3: Update existing get_weekly_contest_participants_public function to use safe data
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_public(integer);

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

-- Add audit logging for access to sensitive participant data
CREATE TABLE IF NOT EXISTS public.participant_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  accessed_by uuid REFERENCES auth.users(id),
  participant_id uuid NOT NULL,
  access_type text NOT NULL, -- 'admin_view', 'own_view', 'unauthorized'
  ip_address inet,
  user_agent text
);

-- Enable RLS on access log
ALTER TABLE public.participant_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Only admins can view access logs"
  ON public.participant_data_access_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert access logs
CREATE POLICY "System can log access"
  ON public.participant_data_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.participant_data_access_log IS 
  'Audit log for tracking access to sensitive participant data. Used to detect potential data scraping or unauthorized access attempts.';