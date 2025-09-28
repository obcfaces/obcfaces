-- Drop the existing constraint that might be causing issues
ALTER TABLE public.contestant_ratings 
DROP CONSTRAINT IF EXISTS contestant_ratings_user_contestant_unique;

-- Add the correct unique constraint for user_id and participant_id
ALTER TABLE public.contestant_ratings 
ADD CONSTRAINT contestant_ratings_user_participant_unique 
UNIQUE (user_id, participant_id);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_user_participant ON contestant_ratings(user_id, participant_id);