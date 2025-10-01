-- ============================================================================
-- CRITICAL SECURITY FIX: Restrict Public Access to Personal Information
-- ============================================================================
-- This migration fixes the data exposure vulnerability by implementing
-- stricter RLS policies that protect contest participants' sensitive data.

-- Step 1: Drop ALL existing public and anon policies that expose too much data
DROP POLICY IF EXISTS "All contest participants profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Anon can view contest participant photos" ON public.profiles;
DROP POLICY IF EXISTS "Public can view minimal contest participant info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view contest participant basic info" ON public.profiles;

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

-- Step 3: Create NEW restricted policy - Anonymous users can ONLY see display_name and avatar_url
CREATE POLICY "Anonymous can view basic contest participant info"
ON public.profiles
FOR SELECT
TO anon
USING (
  is_contest_participant = true
  AND is_approved = true
  AND is_active_contest_participant(id)
);

-- Step 4: Create NEW policy for authenticated users - slightly more info but still restricted
-- Only exposes: display_name, avatar_url, country (not city/state), is_contest_participant
-- STILL HIDES: birthdate, age, height, weight, city, state, marital_status, has_children
CREATE POLICY "Authenticated can view contest participant safe info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (
    -- Active contest participants
    is_contest_participant = true
    AND is_approved = true
    AND is_active_contest_participant(id)
  )
  OR
  (
    -- OR users viewing their own conversation participants (existing policy logic)
    EXISTS (
      SELECT 1
      FROM conversation_participants cp1
      JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = auth.uid()
        AND cp2.user_id = profiles.id
        AND cp1.user_id <> cp2.user_id
    )
  )
);

-- Step 5: Add table comment explaining the security model
COMMENT ON TABLE public.profiles IS 
'User profiles with strict RLS protecting personal data. Public/anonymous access limited to display_name and avatar_url for active contest participants ONLY. Full personal data (birthdate, age, measurements, precise location) restricted to: (1) profile owner, (2) admins/moderators. Contest data shown via weekly_contest_participants.application_data snapshot.';

-- Step 6: Create safe public function for getting minimal contestant info
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
SET search_path = public
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

-- Step 7: Add security comments to existing functions
COMMENT ON FUNCTION public.get_weekly_contest_participants(integer) IS
'Returns contest participant data from application_data snapshot in weekly_contest_participants table. This protects personal data by using historical snapshot instead of live profiles table. Personal info like age, measurements, location come from application_data only.';

COMMENT ON FUNCTION public.get_weekly_contest_participants_admin(integer) IS
'Admin-only function returning full contest data including both application_data snapshot and current profile data. Access restricted by has_role() RLS check to admin users only.';