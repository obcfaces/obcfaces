-- First, delete likes associated with duplicate participant records (keeping oldest)
DELETE FROM public.likes
WHERE participant_id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
    FROM public.weekly_contest_participants
  ) ranked
  WHERE rn > 1
);

-- Then delete the duplicate participant records, keeping only the oldest for each user
DELETE FROM public.weekly_contest_participants
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
    FROM public.weekly_contest_participants
  ) ranked
  WHERE rn > 1
);