-- Update RLS policy for contestant_ratings to block suspicious users from voting
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.contestant_ratings;

CREATE POLICY "Users can create their own ratings"
ON public.contestant_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND NOT has_role(auth.uid(), 'suspicious'::app_role)
);