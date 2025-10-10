-- Update RLS policy to allow viewing history for weekly_contest_participants
DROP POLICY IF EXISTS "Users can view their own application history" ON contest_application_history;

CREATE POLICY "Users can view their own application history"
ON contest_application_history
FOR SELECT
TO public
USING (
  application_id IN (
    SELECT id FROM weekly_contest_participants
    WHERE user_id = auth.uid()
  )
);