
-- Make all active contest participants' profiles public
-- This includes THIS WEEK, PAST WEEK, and NEXT WEEK participants

UPDATE profiles p
SET 
  is_approved = true,
  privacy_level = 'public',
  is_contest_participant = true
WHERE p.id IN (
  SELECT DISTINCT wcp.user_id
  FROM weekly_contest_participants wcp
  JOIN contest_applications ca ON ca.user_id = wcp.user_id
  WHERE wcp.is_active = true
    AND ca.status = 'approved'
    AND ca.is_active = true
    AND ca.deleted_at IS NULL
)
AND (
  p.is_approved IS NULL 
  OR p.is_approved = false 
  OR p.privacy_level != 'public'
  OR p.is_contest_participant != true
);

-- Add RLS policy for public viewing of all active contest participants' profiles
DROP POLICY IF EXISTS "Contest participants profiles are viewable" ON public.profiles;

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
