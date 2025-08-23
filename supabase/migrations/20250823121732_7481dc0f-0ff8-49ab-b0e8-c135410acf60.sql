-- Add unique constraint to ensure one rating per user per contestant
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