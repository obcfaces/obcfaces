-- Grant public access to RPC function for viewing contest participant photos
-- This allows everyone (including anonymous users) to view photos of active contest participants

GRANT EXECUTE ON FUNCTION get_public_contest_participant_photos(uuid[]) TO anon, authenticated;

-- Also ensure the policy allows viewing past participants
DROP POLICY IF EXISTS "Anyone can view active contest participants" ON public.weekly_contest_participants;

CREATE POLICY "Anyone can view contest participants for display"
ON public.weekly_contest_participants
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND deleted_at IS NULL
  AND admin_status IN ('this week', 'next week', 'next week on site', 'past')
);