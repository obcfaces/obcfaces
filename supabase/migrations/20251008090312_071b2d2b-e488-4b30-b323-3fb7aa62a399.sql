
-- Create security definer function to check if user's email is confirmed
CREATE OR REPLACE FUNCTION public.is_email_confirmed(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id 
      AND email_confirmed_at IS NOT NULL
  );
$$;

-- Drop the old policy
DROP POLICY IF EXISTS "Users can create their own ratings" ON public.contestant_ratings;

-- Create new policy using the security definer function
CREATE POLICY "Users can create their own ratings"
ON public.contestant_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND NOT has_role(auth.uid(), 'suspicious'::app_role)
  AND is_email_confirmed(auth.uid())
);

-- Also update the UPDATE policy if it has the same issue
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.contestant_ratings;

CREATE POLICY "Users can update their own ratings"
ON public.contestant_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND NOT has_role(auth.uid(), 'suspicious'::app_role)
  AND is_email_confirmed(auth.uid())
);
