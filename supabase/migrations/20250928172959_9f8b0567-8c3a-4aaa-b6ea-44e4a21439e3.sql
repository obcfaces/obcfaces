-- Clean up duplicate ratings (keeping the most recent one)
WITH ranked_ratings AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, contestant_name ORDER BY updated_at DESC) as rn
  FROM contestant_ratings
)
DELETE FROM contestant_ratings 
WHERE id IN (
  SELECT id FROM ranked_ratings WHERE rn > 1
);

-- Update ratings with proper contestant_user_id and participant_id
UPDATE contestant_ratings 
SET 
  contestant_user_id = wcp.user_id, 
  participant_id = wcp.id
FROM weekly_contest_participants wcp 
WHERE TRIM(REGEXP_REPLACE(contestant_ratings.contestant_name, '\s+', ' ', 'g')) = 
      TRIM(REGEXP_REPLACE(CONCAT(wcp.application_data->>'first_name', ' ', wcp.application_data->>'last_name'), '\s+', ' ', 'g'))
AND contestant_ratings.contestant_user_id IS NULL;

-- Update participant statistics
SELECT update_participant_rating_stats();