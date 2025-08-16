-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;

-- Create corrected policies
CREATE POLICY "Users can view participants of their conversations" 
ON conversation_participants 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants cp2 
    WHERE cp2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to conversations they're in" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants cp2 
    WHERE cp2.user_id = auth.uid()
  )
);