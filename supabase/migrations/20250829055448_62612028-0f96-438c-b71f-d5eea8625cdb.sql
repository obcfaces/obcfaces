-- Fix infinite recursion in conversation_participants RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

-- Create a security definer function to check conversation membership without recursion
CREATE OR REPLACE FUNCTION public.check_user_in_conversation_safe(conversation_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Direct check without using conversation_participants table in the policy context
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param
  );
$function$;

-- Create new policies using the security definer function
CREATE POLICY "Users can view participants of their conversations new"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT DISTINCT cp.conversation_id
    FROM conversation_participants cp
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to conversations they're in new"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);