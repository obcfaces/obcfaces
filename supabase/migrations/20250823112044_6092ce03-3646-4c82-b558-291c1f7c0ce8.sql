-- Create trigger to update weekly contest participants when ratings change
CREATE OR REPLACE FUNCTION update_contest_participant_rating()
RETURNS TRIGGER AS $$
DECLARE
    participant_record RECORD;
    avg_rating NUMERIC;
    vote_count INTEGER;
BEGIN
    -- Get the participant record
    SELECT * INTO participant_record 
    FROM weekly_contest_participants 
    WHERE user_id = COALESCE(NEW.contestant_user_id, OLD.contestant_user_id);
    
    -- If no participant record found, return
    IF participant_record IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate new average rating and total votes
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, vote_count
    FROM contestant_ratings 
    WHERE contestant_user_id = participant_record.user_id;
    
    -- Update the weekly contest participant record
    UPDATE weekly_contest_participants 
    SET 
        average_rating = avg_rating,
        total_votes = vote_count
    WHERE user_id = participant_record.user_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT, UPDATE, and DELETE on contestant_ratings
DROP TRIGGER IF EXISTS update_participant_rating_on_insert ON contestant_ratings;
DROP TRIGGER IF EXISTS update_participant_rating_on_update ON contestant_ratings;
DROP TRIGGER IF EXISTS update_participant_rating_on_delete ON contestant_ratings;

CREATE TRIGGER update_participant_rating_on_insert
    AFTER INSERT ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_participant_rating();

CREATE TRIGGER update_participant_rating_on_update
    AFTER UPDATE ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_participant_rating();

CREATE TRIGGER update_participant_rating_on_delete
    AFTER DELETE ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_contest_participant_rating();

-- Update existing participant ratings
UPDATE weekly_contest_participants 
SET 
    average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM contestant_ratings 
        WHERE contestant_user_id = weekly_contest_participants.user_id
    ),
    total_votes = (
        SELECT COUNT(*)
        FROM contestant_ratings 
        WHERE contestant_user_id = weekly_contest_participants.user_id
    );