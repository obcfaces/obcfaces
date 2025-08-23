-- Fix the security issue with search_path and improve the get_or_create_conversation function
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conversation_id UUID;
  participant_ids UUID[];
BEGIN
  -- Don't allow conversation with oneself
  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'Cannot create conversation with oneself';
  END IF;

  -- Sort user IDs to ensure consistent ordering (prevents duplicates from different order)
  participant_ids := CASE 
    WHEN user1_id < user2_id THEN ARRAY[user1_id, user2_id]
    ELSE ARRAY[user2_id, user1_id]
  END;

  -- Check if conversation already exists between these users with improved logic
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE EXISTS (
    SELECT 1 FROM conversation_participants cp1 
    WHERE cp1.conversation_id = c.id AND cp1.user_id = participant_ids[1]
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2 
    WHERE cp2.conversation_id = c.id AND cp2.user_id = participant_ids[2]
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
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES
      (conversation_id, participant_ids[1], now()),
      (conversation_id, participant_ids[2], now());
      
    RAISE NOTICE 'Created conversation % with participants % and %', conversation_id, participant_ids[1], participant_ids[2];
  ELSE
    RAISE NOTICE 'Found existing conversation % between % and %', conversation_id, participant_ids[1], participant_ids[2];
  END IF;

  RETURN conversation_id;
END;
$$;