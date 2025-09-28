-- Clean up duplicate records first
DELETE FROM winner_content WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY participant_id ORDER BY created_at) as rn
    FROM winner_content
  ) t WHERE rn > 1
);

-- Update the remaining record to be for April Rose Jaluag instead of Pisao Justine May
UPDATE winner_content 
SET 
  participant_id = '68eb6871-1dd9-4719-a026-dd4c63bd2894',
  user_id = 'c509d4a9-b64a-42ca-8e31-90728ed3e3f3'
WHERE participant_id = '057aeb09-5b2f-43fb-a0d7-b8a64da48ff0';