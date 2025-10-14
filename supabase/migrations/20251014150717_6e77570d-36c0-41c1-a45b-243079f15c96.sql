
-- Add RLS policy for admins and moderators to view all votes in next_week_votes
CREATE POLICY "Admins and moderators can view all next week votes"
ON next_week_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'moderator')
  )
);
