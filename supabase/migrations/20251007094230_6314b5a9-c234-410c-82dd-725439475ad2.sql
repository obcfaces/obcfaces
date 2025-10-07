-- Add week_interval column to contestant_ratings table to store the week when vote was cast
ALTER TABLE contestant_ratings 
ADD COLUMN IF NOT EXISTS week_interval text;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_week_interval 
ON contestant_ratings(week_interval);

-- Backfill existing ratings with current week_interval from participants
UPDATE contestant_ratings cr
SET week_interval = wcp.week_interval
FROM weekly_contest_participants wcp
WHERE cr.participant_id = wcp.id
AND cr.week_interval IS NULL;

-- Create trigger to automatically set week_interval when rating is created
CREATE OR REPLACE FUNCTION set_rating_week_interval()
RETURNS TRIGGER AS $$
BEGIN
  -- Get week_interval from the participant being rated
  SELECT week_interval INTO NEW.week_interval
  FROM weekly_contest_participants
  WHERE id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_rating_week_interval_trigger
BEFORE INSERT ON contestant_ratings
FOR EACH ROW
EXECUTE FUNCTION set_rating_week_interval();