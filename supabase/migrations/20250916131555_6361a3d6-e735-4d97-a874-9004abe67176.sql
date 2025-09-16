-- Add public access policy for viewing contest likes
CREATE POLICY "Public can view contest likes"
ON public.likes
FOR SELECT
USING (content_type = 'contest');

-- Add public access policy for viewing contest comments  
CREATE POLICY "Public can view contest comments"
ON public.photo_comments
FOR SELECT
USING (content_type = 'contest');