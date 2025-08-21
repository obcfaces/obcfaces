-- Add last_read_at column to track when user last read messages in a conversation
ALTER TABLE public.conversation_participants 
ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  conversation_id_param UUID,
  user_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_participants 
  SET last_read_at = now()
  WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param;
END;
$$;

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION public.get_unread_messages_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_unread INTEGER := 0;
  conv_record RECORD;
  unread_count INTEGER;
BEGIN
  -- Loop through all conversations for this user
  FOR conv_record IN 
    SELECT conversation_id, last_read_at
    FROM public.conversation_participants 
    WHERE user_id = user_id_param
  LOOP
    -- Count unread messages in this conversation
    SELECT COUNT(*)::INTEGER INTO unread_count
    FROM public.messages 
    WHERE conversation_id = conv_record.conversation_id
      AND sender_id != user_id_param
      AND is_deleted = false
      AND created_at > COALESCE(conv_record.last_read_at, '1970-01-01'::timestamp);
    
    total_unread := total_unread + unread_count;
  END LOOP;
  
  RETURN total_unread;
END;
$$;

-- Create function to get unread count for specific conversation
CREATE OR REPLACE FUNCTION public.get_conversation_unread_count(
  conversation_id_param UUID,
  user_id_param UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_read TIMESTAMP WITH TIME ZONE;
  unread_count INTEGER;
BEGIN
  -- Get when user last read this conversation
  SELECT last_read_at INTO last_read
  FROM public.conversation_participants 
  WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param;
  
  -- Count unread messages
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM public.messages 
  WHERE conversation_id = conversation_id_param
    AND sender_id != user_id_param
    AND is_deleted = false
    AND created_at > COALESCE(last_read, '1970-01-01'::timestamp);
  
  RETURN unread_count;
END;
$$;