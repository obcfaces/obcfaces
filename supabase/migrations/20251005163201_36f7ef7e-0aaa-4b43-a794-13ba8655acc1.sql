-- Update function to exclude suspicious users from rating calculations
CREATE OR REPLACE FUNCTION public.update_participant_rating_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    -- EXCLUDING ratings from suspicious users
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, vote_count
    FROM contestant_ratings cr
    WHERE cr.participant_id = target_participant_id
      -- Exclude ratings from suspicious users
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = cr.user_id 
        AND ur.role = 'suspicious'
      );
    
    -- Update the weekly contest participant record
    UPDATE weekly_contest_participants 
    SET 
        average_rating = avg_rating,
        total_votes = vote_count
    WHERE id = target_participant_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recalculate all ratings to exclude suspicious users
UPDATE weekly_contest_participants wcp
SET 
  average_rating = stats.avg_rating,
  total_votes = stats.vote_count
FROM (
  SELECT 
    cr.participant_id,
    COALESCE(AVG(cr.rating), 0) as avg_rating,
    COUNT(*) as vote_count
  FROM contestant_ratings cr
  WHERE cr.participant_id IS NOT NULL
    -- Exclude ratings from suspicious users
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = cr.user_id 
      AND ur.role = 'suspicious'
    )
  GROUP BY cr.participant_id
) stats
WHERE wcp.id = stats.participant_id;