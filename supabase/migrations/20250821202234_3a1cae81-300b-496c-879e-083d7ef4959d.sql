-- Fix RLS policy for conversations table to allow proper conversation creation
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create a new policy that allows authenticated users to create conversations
CREATE POLICY "Authenticated users can create conversations" 
ON conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Also ensure users can update conversations they participate in
CREATE POLICY "Users can update conversations they participate in" 
ON conversations 
FOR UPDATE 
TO authenticated 
USING (id IN (
  SELECT conversation_id 
  FROM conversation_participants 
  WHERE user_id = auth.uid()
));