
-- Allow public access to weekly contest participants for viewing
-- This ensures all sections (THIS WEEK, PAST WEEK, NEXT WEEK) are visible to everyone

CREATE POLICY "Weekly contest participants are publicly viewable"
ON public.weekly_contest_participants
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 
    FROM contest_applications ca
    WHERE ca.user_id = weekly_contest_participants.user_id
      AND ca.status = 'approved'
      AND ca.is_active = true
      AND ca.deleted_at IS NULL
  )
);

-- Update the existing "Public can view active weekly contest participants" policy
-- to be more permissive
DROP POLICY IF EXISTS "Public can view active weekly contest participants" ON public.weekly_contest_participants;
