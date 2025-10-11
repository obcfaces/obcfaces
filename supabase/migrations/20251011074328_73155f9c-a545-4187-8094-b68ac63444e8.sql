-- Fix contestant_user_id column references
-- The column was removed but old functions/triggers still reference it

-- Drop old functions that reference contestant_user_id
DROP FUNCTION IF EXISTS public.get_contestant_average_rating(TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_rating_stats(TEXT, UUID);

-- Recreate functions without contestant_user_id
CREATE OR REPLACE FUNCTION public.get_contestant_average_rating(contestant_name_param TEXT)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM contestant_ratings
  WHERE contestant_name = contestant_name_param;
$$ LANGUAGE SQL STABLE;

-- Update any triggers that might reference it
DROP TRIGGER IF EXISTS update_participant_ratings_trigger ON contestant_ratings;
DROP TRIGGER IF EXISTS update_participant_total_votes_trigger ON contestant_ratings;

-- Recreate trigger for rating updates
CREATE OR REPLACE FUNCTION update_participant_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average_rating and total_votes for the participant
  UPDATE weekly_contest_participants
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM contestant_ratings
      WHERE participant_id = NEW.participant_id
    ),
    total_votes = (
      SELECT COUNT(DISTINCT user_id)
      FROM contestant_ratings
      WHERE participant_id = NEW.participant_id
    )
  WHERE id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_participant_ratings_trigger
AFTER INSERT OR UPDATE OR DELETE ON contestant_ratings
FOR EACH ROW
EXECUTE FUNCTION update_participant_ratings();