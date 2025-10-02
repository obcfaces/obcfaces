-- Add public view policy for weekly contest participants
-- This allows everyone to view active participants with 'this week', 'next week', or 'next week on site' status

CREATE POLICY "Anyone can view active contest participants"
ON public.weekly_contest_participants
FOR SELECT
TO public
USING (
  is_active = true 
  AND deleted_at IS NULL
  AND admin_status IN ('this week', 'next week', 'next week on site', 'past')
);

-- Grant execute permission on public RPC function
GRANT EXECUTE ON FUNCTION get_weekly_contest_participants_public(integer) TO anon, authenticated;