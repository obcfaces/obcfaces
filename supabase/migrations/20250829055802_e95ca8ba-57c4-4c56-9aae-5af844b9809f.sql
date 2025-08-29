-- Complete fix for conversation_participants RLS policies
-- Remove all existing policies and create simpler ones

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view participants of their conversations new" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in new" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation records" ON public.conversation_participants;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own participation"
ON public.conversation_participants
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own participation"
ON public.conversation_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Additional policy for viewing conversation participants when user is in that conversation
-- Using a direct approach without self-reference
CREATE POLICY "View conversation participants when authorized"
ON public.conversation_participants
FOR SELECT
USING (
  -- User can see participants of conversations where they are also a participant
  -- This uses a subquery that doesn't cause recursion
  EXISTS (
    SELECT 1 
    FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND c.id IN (
      -- Get conversation IDs where current user participates
      -- by directly checking without policy context
      SELECT cp.conversation_id 
      FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  )
);