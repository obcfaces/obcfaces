-- Remove duplicate Jin Carrida entries, keeping only the oldest one
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM weekly_contest_participants 
  WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942'
)
DELETE FROM weekly_contest_participants 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);