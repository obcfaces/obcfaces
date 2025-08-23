-- First, remove duplicate ratings keeping only the latest one per user-contestant pair
WITH ranked_ratings AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, contestant_user_id 
           ORDER BY updated_at DESC, created_at DESC
         ) as rn
  FROM public.contestant_ratings
  WHERE contestant_user_id IS NOT NULL
)
DELETE FROM public.contestant_ratings 
WHERE id IN (
  SELECT id FROM ranked_ratings WHERE rn > 1
);

-- Also handle cases where contestant_user_id is null but contestant_name is duplicated
WITH ranked_name_ratings AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, contestant_name 
           ORDER BY updated_at DESC, created_at DESC
         ) as rn
  FROM public.contestant_ratings
  WHERE contestant_user_id IS NULL
)
DELETE FROM public.contestant_ratings 
WHERE id IN (
  SELECT id FROM ranked_name_ratings WHERE rn > 1
);

-- Now add the unique constraint for user_id + contestant_user_id
ALTER TABLE public.contestant_ratings 
ADD CONSTRAINT unique_user_contestant_rating 
UNIQUE (user_id, contestant_user_id);

-- Create index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_user_contestant 
ON public.contestant_ratings (user_id, contestant_user_id);

-- Also create fallback constraint for contestant_name in case contestant_user_id is null
CREATE UNIQUE INDEX IF NOT EXISTS idx_contestant_ratings_user_name_unique
ON public.contestant_ratings (user_id, contestant_name) 
WHERE contestant_user_id IS NULL;