-- Fix RLS policies to use the new simple approach
DROP POLICY IF EXISTS "Users can view their own participation records" ON public.conversation_participants;

CREATE POLICY "Users can view their own participation records" 
ON public.conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());