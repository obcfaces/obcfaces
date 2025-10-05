-- Fix trigger function that references non-existent contestant_user_id column
-- The contestant_ratings table only has: user_id, participant_id, contestant_name, rating

DROP TRIGGER IF EXISTS update_participant_rating_on_insert ON contestant_ratings;
DROP TRIGGER IF EXISTS update_participant_rating_on_update ON contestant_ratings;
DROP TRIGGER IF EXISTS update_participant_rating_on_delete ON contestant_ratings;
DROP TRIGGER IF EXISTS update_participant_rating_comprehensive_trigger ON contestant_ratings;

-- Drop old functions that reference contestant_user_id
DROP FUNCTION IF EXISTS update_participant_rating_comprehensive() CASCADE;
DROP FUNCTION IF EXISTS update_participant_rating() CASCADE;

-- Create new simplified trigger function that only uses existing columns
CREATE OR REPLACE FUNCTION update_participant_rating_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_participant_id UUID;
    avg_rating NUMERIC;
    vote_count INTEGER;
BEGIN
    -- Get the participant_id from the rating record
    target_participant_id := COALESCE(NEW.participant_id, OLD.participant_id);
    
    -- Skip if no participant_id
    IF target_participant_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate new average rating and total votes for this participant
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, vote_count
    FROM contestant_ratings 
    WHERE participant_id = target_participant_id;
    
    -- Update the weekly contest participant record
    UPDATE weekly_contest_participants 
    SET 
        average_rating = avg_rating,
        total_votes = vote_count
    WHERE id = target_participant_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for INSERT, UPDATE, and DELETE
CREATE TRIGGER update_participant_rating_on_insert
    AFTER INSERT ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_rating_on_change();

CREATE TRIGGER update_participant_rating_on_update
    AFTER UPDATE ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_rating_on_change();

CREATE TRIGGER update_participant_rating_on_delete
    AFTER DELETE ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_rating_on_change();