-- Add RLS policy to allow public viewing of weekly contest participants
CREATE POLICY "Public can view active weekly contest participants" 
ON public.weekly_contest_participants 
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM contest_applications ca 
    WHERE ca.user_id = weekly_contest_participants.user_id 
    AND ca.status = 'approved'
    AND ca.is_active = true
    AND ca.deleted_at IS NULL
  )
);