-- Drop the problematic policy
DROP POLICY "Users can view participants of their conversations" ON public.conversation_participants;

-- Create a security definer function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.user_is_in_conversation(conversation_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param
  );
$$;

-- Create correct RLS policy using the function
CREATE POLICY "Users can view participants of their conversations v2" 
ON public.conversation_participants 
FOR SELECT 
USING (
  public.user_is_in_conversation(conversation_id, auth.uid())
);