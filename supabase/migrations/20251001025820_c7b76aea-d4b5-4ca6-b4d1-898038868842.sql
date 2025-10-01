-- Drop the restrictive policy that requires approved application
DROP POLICY IF EXISTS "Weekly contest participants are publicly viewable" ON weekly_contest_participants;

-- Create new simple public policy - all active participants are viewable
CREATE POLICY "All active weekly contest participants are publicly viewable"
ON weekly_contest_participants
FOR SELECT
TO public
USING (is_active = true);