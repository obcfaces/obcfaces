-- Allow public (anonymous) users to view winner content
CREATE POLICY "Public can view winner content"
ON public.winner_content
FOR SELECT
TO anon
USING (true);