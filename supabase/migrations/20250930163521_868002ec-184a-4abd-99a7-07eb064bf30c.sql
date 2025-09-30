-- Drop the overly permissive public SELECT policy on winner_content
DROP POLICY IF EXISTS "Winner content is viewable by everyone" ON public.winner_content;

-- Create a more secure policy that only allows authenticated users to view winner content
CREATE POLICY "Authenticated users can view winner content"
ON public.winner_content
FOR SELECT
TO authenticated
USING (true);

-- Ensure admins policy still exists for full management
-- (This should already exist, but we're being explicit)
DROP POLICY IF EXISTS "Admins can manage winner content" ON public.winner_content;

CREATE POLICY "Admins can manage winner content"
ON public.winner_content
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));