-- Add unique constraint for user_id and contestant_name combination
-- This will allow upsert to work properly
ALTER TABLE public.contestant_ratings 
ADD CONSTRAINT contestant_ratings_user_contestant_unique 
UNIQUE (user_id, contestant_name);