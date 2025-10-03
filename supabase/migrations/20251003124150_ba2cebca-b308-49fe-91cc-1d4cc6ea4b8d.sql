-- ============================================
-- FIX: Security Definer View Issue
-- ============================================
-- Recreate the contest_participants_safe view with SECURITY INVOKER
-- This ensures the view respects the querying user's permissions and RLS policies

-- Step 1: Drop the policy that depends on the view
DROP POLICY IF EXISTS "Anyone can view safe contest participant info" ON public.profiles;

-- Step 2: Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.contest_participants_safe;

CREATE VIEW public.contest_participants_safe
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.display_name,
  p.avatar_url,
  p.is_contest_participant
FROM public.profiles p
WHERE p.is_contest_participant = true 
  AND p.is_approved = true
  AND EXISTS (
    SELECT 1 FROM public.weekly_contest_participants wcp
    WHERE wcp.user_id = p.id 
      AND wcp.is_active = true
      AND wcp.deleted_at IS NULL
      AND wcp.admin_status IN ('this week', 'next week', 'next week on site', 'past')
  );

-- Step 3: Re-add the comment
COMMENT ON VIEW public.contest_participants_safe IS 
'Safe public view of contest participants with SECURITY INVOKER. 
Exposes ONLY display_name and avatar_url. 
NO PII (email, birthdate, address, physical characteristics, bio) is exposed.
Runs with querying user permissions for enhanced security.';

-- Step 4: Re-grant access
GRANT SELECT ON public.contest_participants_safe TO anon;
GRANT SELECT ON public.contest_participants_safe TO authenticated;

-- Step 5: Recreate the policy using the new view
CREATE POLICY "Anyone can view safe contest participant info"
ON public.profiles
FOR SELECT
TO public
USING (
  id IN (
    SELECT id FROM public.contest_participants_safe
  )
  AND is_contest_participant = true
);