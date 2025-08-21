-- Fix infinite recursion in RLS policies by simplifying them

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Create simplified policies without recursion
CREATE POLICY "Users can view their own participation records" 
ON public.conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view conversations where they are participants" 
ON public.conversations 
FOR SELECT 
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in conversations they participate in" 
ON public.messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);