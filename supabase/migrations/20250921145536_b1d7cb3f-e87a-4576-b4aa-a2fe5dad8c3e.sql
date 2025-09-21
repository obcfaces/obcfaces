-- Fix rating calculation trigger to ensure proper synchronization
DROP TRIGGER IF EXISTS update_weekly_contest_participants_rating ON contestant_ratings;

-- Update the trigger function to properly handle both participant_id and contestant_user_id
CREATE OR REPLACE FUNCTION public.update_participant_rating_comprehensive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    target_user_id UUID;
    avg_rating NUMERIC;
    vote_count INTEGER;
BEGIN
    -- Get the user_id from either NEW or OLD record
    target_user_id := COALESCE(NEW.contestant_user_id, OLD.contestant_user_id);
    
    -- Skip if no user_id
    IF target_user_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate new average rating and total votes for this user
    SELECT 
        COALESCE(AVG(rating), 0)::NUMERIC(3,1),
        COUNT(*)
    INTO avg_rating, vote_count
    FROM contestant_ratings 
    WHERE contestant_user_id = target_user_id;
    
    -- Update ALL weekly contest participant records for this user
    UPDATE weekly_contest_participants 
    SET 
        average_rating = avg_rating,
        total_votes = vote_count
    WHERE user_id = target_user_id;
    
    -- Also update if there's a participant_id match
    IF COALESCE(NEW.participant_id, OLD.participant_id) IS NOT NULL THEN
        UPDATE weekly_contest_participants 
        SET 
            average_rating = avg_rating,
            total_votes = vote_count
        WHERE id = COALESCE(NEW.participant_id, OLD.participant_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger for INSERT, UPDATE, and DELETE
CREATE TRIGGER update_weekly_contest_participants_rating_comprehensive
    AFTER INSERT OR UPDATE OR DELETE ON contestant_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_rating_comprehensive();