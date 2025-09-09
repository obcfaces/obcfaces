-- Add RLS policy to allow everyone to check if applications are approved
-- This is needed for the public function to work for unauthenticated users
CREATE POLICY "Public can check approved applications status" 
ON public.contest_applications 
FOR SELECT 
USING (
  status = 'approved' 
  AND is_active = true 
  AND deleted_at IS NULL
);