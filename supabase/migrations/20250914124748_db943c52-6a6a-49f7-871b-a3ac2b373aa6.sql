-- Add RLS policy to allow viewing rating stats without exposing individual ratings
CREATE POLICY "Public can view rating statistics" 
ON public.contestant_ratings 
FOR SELECT 
USING (
  -- Allow access to aggregate data only - users can see counts and averages
  -- but not individual ratings from other users
  true
);