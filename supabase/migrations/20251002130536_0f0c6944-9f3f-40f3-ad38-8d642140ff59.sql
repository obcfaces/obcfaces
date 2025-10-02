-- Add INSERT policy for users to create their own contest applications
CREATE POLICY "Users can create their own participation records"
ON public.weekly_contest_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure users can also update their own records before submission
CREATE POLICY "Users can update their own pending records"
ON public.weekly_contest_participants
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND admin_status IN ('pending', 'under_review', 'approved', 'rejected')
)
WITH CHECK (auth.uid() = user_id);