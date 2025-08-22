-- Update existing conversation participants to have proper last_read_at
UPDATE conversation_participants 
SET last_read_at = now() 
WHERE last_read_at = '1970-01-01 00:00:00+00'::timestamp;