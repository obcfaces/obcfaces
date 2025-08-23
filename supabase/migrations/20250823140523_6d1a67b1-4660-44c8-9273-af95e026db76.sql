-- Function to clean up duplicate conversations
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    duplicate_record RECORD;
    keep_conversation_id UUID;
    delete_conversation_id UUID;
BEGIN
    -- Find and merge duplicate conversations
    FOR duplicate_record IN
        SELECT 
            array_agg(c.id ORDER BY c.created_at ASC) as conversation_ids,
            array_agg(DISTINCT cp.user_id) as user_ids
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        GROUP BY (
            SELECT array_agg(cp2.user_id ORDER BY cp2.user_id) 
            FROM conversation_participants cp2 
            WHERE cp2.conversation_id = c.id
        )
        HAVING COUNT(DISTINCT c.id) > 1
    LOOP
        -- Keep the oldest conversation, delete the newer ones
        keep_conversation_id := duplicate_record.conversation_ids[1];
        
        -- Move messages from duplicate conversations to the main one
        FOR i IN 2..array_length(duplicate_record.conversation_ids, 1) LOOP
            delete_conversation_id := duplicate_record.conversation_ids[i];
            
            -- Update messages to point to the kept conversation
            UPDATE messages 
            SET conversation_id = keep_conversation_id 
            WHERE conversation_id = delete_conversation_id;
            
            -- Delete duplicate participants
            DELETE FROM conversation_participants 
            WHERE conversation_id = delete_conversation_id;
            
            -- Delete duplicate conversation
            DELETE FROM conversations 
            WHERE id = delete_conversation_id;
            
            RAISE NOTICE 'Merged conversation % into %', delete_conversation_id, keep_conversation_id;
        END LOOP;
    END LOOP;
END;
$$;

-- Run the cleanup
SELECT cleanup_duplicate_conversations();

-- Improve the get_or_create_conversation function to prevent future duplicates
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

  -- Sort user IDs to ensure consistent ordering
  participant_ids := CASE 
    WHEN user1_id < user2_id THEN ARRAY[user1_id, user2_id]
    ELSE ARRAY[user2_id, user1_id]
  END;

  -- Check if conversation already exists between these users (more robust check)
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.id IN (
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    WHERE cp1.user_id = participant_ids[1]
    INTERSECT
    SELECT cp2.conversation_id
    FROM conversation_participants cp2
    WHERE cp2.user_id = participant_ids[2]
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id
  ) = 2
  LIMIT 1;

  -- If conversation doesn't exist, create it
  IF conversation_id IS NULL THEN
    -- Use a transaction to prevent race conditions
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