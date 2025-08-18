-- Fix infinite recursion in conversation_participants policies
-- The policy is referencing the same table it's applied to, causing infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

-- Create a function to check if user is in conversation (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.user_in_conversation(conversation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = $1 
    AND conversation_participants.user_id = $2
  );
$$;

-- Create new policies using the function to avoid recursion
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (user_in_conversation(conversation_id, auth.uid()));

CREATE POLICY "Users can add participants to conversations they're in" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (user_in_conversation(conversation_id, auth.uid()));