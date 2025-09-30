
-- Remove temporary debugging policy that requires authentication
DROP POLICY IF EXISTS "Temporary debugging - authenticated users can view public profi" ON public.profiles;

-- Remove redundant "Contest participants profiles are viewable" policy if exists
DROP POLICY IF EXISTS "Contest participants profiles are viewable" ON public.profiles;

-- Ensure the comprehensive public policy covers all cases
-- This policy allows anyone (including non-authenticated) to view profiles of contest participants
DROP POLICY IF EXISTS "All contest participants profiles are publicly viewable" ON public.profiles;

CREATE POLICY "All contest participants profiles are publicly viewable"
ON public.profiles
FOR SELECT
USING (
  is_contest_participant = true 
  AND is_approved = true 
  AND privacy_level = 'public'
  AND EXISTS (
    SELECT 1 
    FROM weekly_contest_participants wcp
    WHERE wcp.user_id = profiles.id
      AND wcp.is_active = true
  )
);
