-- Find and remove all remaining duplicates in weekly_contest_participants for the same user
WITH duplicates AS (
  SELECT 
    id,
    user_id,
    contest_id,
    admin_status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, contest_id 
      ORDER BY 
        CASE WHEN admin_status = 'pending' THEN 1 ELSE 2 END,
        created_at DESC
    ) as rn
  FROM weekly_contest_participants
  WHERE user_id IN (
    SELECT user_id 
    FROM weekly_contest_participants 
    GROUP BY user_id, contest_id 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM weekly_contest_participants 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);