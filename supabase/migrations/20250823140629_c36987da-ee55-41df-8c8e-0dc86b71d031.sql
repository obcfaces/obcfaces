-- Let's first check what duplicate conversations exist and clean them up more carefully
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_conversations_safe()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    duplicate_record RECORD;
    keep_conversation_id UUID;
    delete_conversation_id UUID;
    message_record RECORD;
BEGIN
    -- Find duplicate conversations between same users
    FOR duplicate_record IN
        WITH conversation_pairs AS (
            SELECT 
                c.id as conversation_id,
                c.created_at,
                array_agg(cp.user_id ORDER BY cp.user_id) as user_pair
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            GROUP BY c.id, c.created_at
            HAVING COUNT(cp.user_id) = 2
        )
        SELECT 
            user_pair,
            array_agg(conversation_id ORDER BY created_at ASC) as conversation_ids
        FROM conversation_pairs
        GROUP BY user_pair
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (oldest) conversation
        keep_conversation_id := duplicate_record.conversation_ids[1];
        
        -- Process each duplicate conversation
        FOR i IN 2..array_length(duplicate_record.conversation_ids, 1) LOOP
            delete_conversation_id := duplicate_record.conversation_ids[i];
            
            -- Move messages from duplicate to keep conversation
            UPDATE messages 
            SET conversation_id = keep_conversation_id 
            WHERE conversation_id = delete_conversation_id;
            
            -- Update last_read_at to the most recent in the kept conversation
            UPDATE conversation_participants cp1
            SET last_read_at = GREATEST(
                cp1.last_read_at,
                (SELECT cp2.last_read_at FROM conversation_participants cp2 
                 WHERE cp2.conversation_id = delete_conversation_id 
                 AND cp2.user_id = cp1.user_id)
            )
            WHERE cp1.conversation_id = keep_conversation_id;
            
            -- Delete duplicate participants
            DELETE FROM conversation_participants 
            WHERE conversation_id = delete_conversation_id;
            
            -- Delete duplicate conversation
            DELETE FROM conversations 
            WHERE id = delete_conversation_id;
            
            RAISE NOTICE 'Merged duplicate conversation % into %', delete_conversation_id, keep_conversation_id;
        END LOOP;
    END LOOP;
END;
$$;

-- Run the safe cleanup
SELECT cleanup_duplicate_conversations_safe();