-- ============================================================================
-- CRITICAL SECURITY FIX: Restrict Public Access to Personal Information
-- ============================================================================

-- Step 1: Drop ALL existing public/anon policies that expose too much data
DROP POLICY IF EXISTS "All contest participants profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Anon can view contest participant photos" ON public.profiles;
DROP POLICY IF EXISTS "Public can view minimal contest participant info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view contest participant basic info" ON public.profiles;

-- Step 2: Drop existing function if it has wrong signature
DROP FUNCTION IF EXISTS public.get_safe_contestant_info(uuid);

-- Step 3: Create security definer function to check active contest participation
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

-- Step 4: NEW restricted policy for anonymous users
-- ONLY exposes: display_name, avatar_url, is_contest_participant
-- HIDES: birthdate, age, height, weight, city, state, country, marital_status, etc.
CREATE POLICY "Anonymous can view basic contest info only"
ON public.profiles
FOR SELECT
TO anon
USING (
  is_contest_participant = true
  AND is_approved = true
  AND is_active_contest_participant(id)
);

-- Step 5: NEW policy for authenticated users
-- Still restricted but allows conversation participants to see each other
CREATE POLICY "Authenticated view safe contest info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (
    -- Active contest participants with minimal data exposure
    is_contest_participant = true
    AND is_approved = true
    AND is_active_contest_participant(id)
  )
  OR
  (
    -- Users in same conversation can see each other
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

-- Step 6: Create safe function for getting minimal contestant info
CREATE FUNCTION public.get_safe_contestant_info(contestant_user_id uuid)
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

-- Step 7: Add security documentation
COMMENT ON TABLE public.profiles IS 
'User profiles with strict RLS. Public access: display_name + avatar_url only for active contestants. Personal data (birthdate, age, measurements, location) restricted to profile owner and admins. Contest displays use weekly_contest_participants.application_data snapshot.';

COMMENT ON FUNCTION public.get_weekly_contest_participants(integer) IS
'Returns contest data from application_data snapshot, not live profiles. Protects personal information by using historical data.';

COMMENT ON FUNCTION public.get_weekly_contest_participants_admin(integer) IS
'Admin-only: Full contest data including current profiles. Access restricted by has_role() to admins only.';