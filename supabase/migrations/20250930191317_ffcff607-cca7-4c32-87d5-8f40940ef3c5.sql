
-- Allow public access to profiles of next week participants
-- This ensures the Next Week section works for non-authenticated users too

CREATE POLICY "Next week participants profiles are publicly viewable"
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
      AND wcp.admin_status IN ('next week', 'next week on site')
      AND wcp.is_active = true
  )
);
