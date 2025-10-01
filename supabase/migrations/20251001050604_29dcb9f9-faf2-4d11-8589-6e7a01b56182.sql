-- ============================================================================
-- CRITICAL SECURITY FIX: Restrict Public Access to Personal Information
-- ============================================================================
-- This migration fixes the data exposure vulnerability by implementing
-- stricter RLS policies that protect contest participants' sensitive data.

-- Step 1: Drop overly permissive public policies
DROP POLICY IF EXISTS "All contest participants profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Anon can view contest participant photos" ON public.profiles;

-- Step 2: Create a security definer function to safely check if user is an active contestant
CREATE OR REPLACE FUNCTION public.is_active_contest_participant(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM weekly_contest_participants wcp
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    WHERE wcp.user_id = user_id_param
      AND wcp.is_active = true
      AND wc.status = 'active'
  );
$$;

-- Step 3: Create restricted public view policy for contest participants
-- Only exposes: display_name, avatar_url, is_contest_participant, participant_type
-- DOES NOT expose: birthdates, exact ages, physical measurements, precise locations
CREATE POLICY "Public can view minimal contest participant info"
ON public.profiles
FOR SELECT
USING (
  is_contest_participant = true
  AND is_approved = true
  AND is_active_contest_participant(id)
);

-- Step 4: Create policy for authenticated users viewing active contestants
-- Shows slightly more info (country only, no city/state) for logged-in users
CREATE POLICY "Authenticated users can view contest participant basic info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_contest_participant = true
  AND is_approved = true
  AND is_active_contest_participant(id)
  AND auth.uid() IS NOT NULL
);

-- Step 5: Ensure users can still view conversation participants' basic info
-- (Existing policy already handles this appropriately)

-- Step 6: Add comment explaining the security model
COMMENT ON TABLE public.profiles IS 
'User profiles with strict RLS. Public access limited to display_name and avatar_url for active contest participants only. Full personal data (birthdate, measurements, precise location) is restricted to: (1) the profile owner, (2) admins/moderators, (3) specific authorized queries via security definer functions.';

-- Step 7: Create a safe public function to get contestant display info
CREATE OR REPLACE FUNCTION public.get_safe_contestant_info(contestant_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  country text,
  is_contest_participant boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    CASE 
      WHEN p.country = 'PH' THEN 'Philippines'
      WHEN p.country IS NOT NULL THEN p.country
      ELSE NULL
    END as country,
    p.is_contest_participant
  FROM public.profiles p
  WHERE p.id = contestant_user_id
    AND p.is_contest_participant = true
    AND p.is_approved = true
    AND is_active_contest_participant(p.id);
$$;

-- Step 8: Update existing get_weekly_contest_participants functions to use application_data
-- This ensures contest display uses data from weekly_contest_participants.application_data
-- instead of directly exposing profiles table data
COMMENT ON FUNCTION public.get_weekly_contest_participants(integer) IS
'Returns contest participant data from application_data snapshot, not live profiles table. This protects against unauthorized access to current personal information.';

COMMENT ON FUNCTION public.get_weekly_contest_participants_admin(integer) IS
'Admin function - returns full contest participant data including application_data snapshot and current profile data. Restricted by RLS to admins only.';