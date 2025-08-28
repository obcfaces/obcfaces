-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations v2" ON public.conversation_participants;

-- Create a security definer function to check conversation membership without recursion
CREATE OR REPLACE FUNCTION public.check_conversation_membership(conversation_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param
  );
$$;

-- Recreate the policies using a different approach to avoid recursion
CREATE POLICY "Users can add participants to conversations they're in" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  -- Allow if the user is adding themselves to any conversation
  user_id = auth.uid() 
  OR 
  -- Allow if there's an existing participant record for the auth user in this conversation
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  -- Users can see participants in conversations where they are also participants
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);