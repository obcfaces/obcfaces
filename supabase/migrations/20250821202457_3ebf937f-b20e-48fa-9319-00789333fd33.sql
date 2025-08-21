-- Fix the orphaned conversation by adding the missing participant
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT '279eeb3a-8b9b-4dae-8980-48ec28a3327f', '17286d26-15d0-45c9-b993-4146c4c3d4f9'
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_participants 
  WHERE conversation_id = '279eeb3a-8b9b-4dae-8980-48ec28a3327f' 
    AND user_id = '17286d26-15d0-45c9-b993-4146c4c3d4f9'
);