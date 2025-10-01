-- Drop existing potentially conflicting policies and create explicit anon-friendly policies

-- For weekly_contest_participants: ensure anon users can read active participants
DROP POLICY IF EXISTS "All active weekly contest participants are publicly viewable" ON weekly_contest_participants;
DROP POLICY IF EXISTS "Anon and authenticated can view active participants" ON weekly_contest_participants;

CREATE POLICY "Anon and authenticated can view active participants"
ON weekly_contest_participants
FOR SELECT
TO public, anon, authenticated
USING (is_active = true);

-- For profiles: allow anon users to read profile photos for active contest participants
DROP POLICY IF EXISTS "Anon can view contest participant photos" ON profiles;

CREATE POLICY "Anon can view contest participant photos"
ON profiles
FOR SELECT
TO public, anon, authenticated
USING (
  is_contest_participant = true 
  AND EXISTS (
    SELECT 1 
    FROM weekly_contest_participants wcp 
    WHERE wcp.user_id = profiles.id 
      AND wcp.is_active = true
  )
);