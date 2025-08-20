-- Add policy to allow everyone to view approved contest applications
CREATE POLICY "Everyone can view approved applications" 
ON public.contest_applications 
FOR SELECT 
USING (status = 'approved');