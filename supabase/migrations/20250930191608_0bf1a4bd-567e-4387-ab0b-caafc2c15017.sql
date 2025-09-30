
-- Clean up redundant policies
DROP POLICY IF EXISTS "Next week participants profiles are publicly viewable" ON public.profiles;

-- Allow public access to view contestant ratings for statistics
DROP POLICY IF EXISTS "Public can view contestant ratings statistics" ON public.contestant_ratings;
CREATE POLICY "Public can view contestant ratings statistics"
ON public.contestant_ratings
FOR SELECT
USING (true);

-- Allow public access to view likes counts
DROP POLICY IF EXISTS "Public can view likes" ON public.likes;
CREATE POLICY "Public can view likes"
ON public.likes
FOR SELECT
USING (true);
