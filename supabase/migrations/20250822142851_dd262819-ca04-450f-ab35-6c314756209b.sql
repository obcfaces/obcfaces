-- Fix the get_or_create_conversation function to set proper last_read_at
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Don't allow conversation with oneself
  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'Cannot create conversation with oneself';
  END IF;

  -- Check if conversation already exists between these users
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp1 
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2 
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;

  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    -- Create new conversation
    INSERT INTO conversations (id) VALUES (gen_random_uuid()) RETURNING id INTO conversation_id;
    
    -- Add both users as participants with proper last_read_at
    INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES
      (conversation_id, user1_id, now()),
      (conversation_id, user2_id, now());
      
    -- Log the creation for debugging
    RAISE NOTICE 'Created conversation % with participants % and %', conversation_id, user1_id, user2_id;
  ELSE
    -- Log that we found existing conversation
    RAISE NOTICE 'Found existing conversation % between % and %', conversation_id, user1_id, user2_id;
  END IF;

  RETURN conversation_id;
END;
$$;