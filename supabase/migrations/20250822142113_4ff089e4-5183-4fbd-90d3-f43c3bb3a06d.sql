-- Allow users to view conversation participants for conversations they are part of
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp_self
    WHERE cp_self.conversation_id = conversation_participants.conversation_id
    AND cp_self.user_id = auth.uid()
  )
);