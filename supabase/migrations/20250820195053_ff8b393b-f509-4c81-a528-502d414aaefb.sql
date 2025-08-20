-- Allow all authenticated users to view likes for counting purposes
-- This is needed to show like counts to everyone, not just the like author
DROP POLICY IF EXISTS "Users can view their own likes" ON public.likes;

CREATE POLICY "Users can view all likes for counting" 
ON public.likes 
FOR SELECT 
USING (true);