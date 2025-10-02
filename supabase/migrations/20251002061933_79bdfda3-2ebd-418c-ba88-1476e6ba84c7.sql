-- Add RLS policy to allow public access to active contest participants
CREATE POLICY "Public can view active contest participants"
ON public.weekly_contest_participants
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND deleted_at IS NULL 
  AND admin_status IN ('this week', 'next week', 'next week on site', 'past')
);