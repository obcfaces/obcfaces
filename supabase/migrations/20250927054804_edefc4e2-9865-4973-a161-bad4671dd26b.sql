-- Remove duplicates from past week sections, keeping only the first record for each user
WITH duplicates_to_remove AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, admin_status ORDER BY created_at ASC) as row_num
  FROM weekly_contest_participants 
  WHERE admin_status LIKE 'past%'
    AND is_active = true
)
DELETE FROM weekly_contest_participants 
WHERE id IN (
  SELECT id 
  FROM duplicates_to_remove 
  WHERE row_num > 1
);