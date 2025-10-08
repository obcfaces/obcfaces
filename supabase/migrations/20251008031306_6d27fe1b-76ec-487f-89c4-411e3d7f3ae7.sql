-- Update RLS policy for contestant_ratings to require email verification
-- This prevents unverified users from voting

-- Drop old policy
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.contestant_ratings;

-- Create new policy with email verification check
CREATE POLICY "Users can create their own ratings"
ON public.contestant_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND NOT has_role(auth.uid(), 'suspicious'::app_role)
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email_confirmed_at IS NOT NULL
  )
);

-- Also update the update policy
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.contestant_ratings;

CREATE POLICY "Users can update their own ratings"
ON public.contestant_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND NOT has_role(auth.uid(), 'suspicious'::app_role)
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email_confirmed_at IS NOT NULL
  )
);