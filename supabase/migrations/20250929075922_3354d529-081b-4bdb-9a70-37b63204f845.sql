-- Удаляем дубликаты участников, оставляя только последнюю (наиболее свежую) запись для каждого пользователя
WITH duplicates_to_delete AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM weekly_contest_participants 
  WHERE is_active = true
)
DELETE FROM weekly_contest_participants 
WHERE id IN (
  SELECT id 
  FROM duplicates_to_delete 
  WHERE rn > 1
);