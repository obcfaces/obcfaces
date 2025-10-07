-- Fix the update_user_voting_stats trigger function
-- The column is 'user_id' not 'contestant_user_id'

DROP TRIGGER IF EXISTS update_voting_stats_on_rating ON public.contestant_ratings;
DROP FUNCTION IF EXISTS public.update_user_voting_stats();

CREATE OR REPLACE FUNCTION public.update_user_voting_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_votes INT;
  v_unique_weeks INT;
  v_week_intervals TEXT[];
  v_first_vote TIMESTAMP WITH TIME ZONE;
  v_last_vote TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate statistics for this user
  SELECT 
    COUNT(*)::INT,
    COUNT(DISTINCT week_interval)::INT,
    array_agg(DISTINCT week_interval ORDER BY week_interval) FILTER (WHERE week_interval IS NOT NULL),
    MIN(created_at),
    MAX(created_at)
  INTO 
    v_total_votes,
    v_unique_weeks,
    v_week_intervals,
    v_first_vote,
    v_last_vote
  FROM contestant_ratings
  WHERE user_id = NEW.user_id;
  
  -- Insert or update statistics
  INSERT INTO user_voting_stats (
    user_id,
    total_votes_count,
    unique_weeks_count,
    voting_week_intervals,
    first_vote_at,
    last_vote_at,
    is_regular_voter
  ) VALUES (
    NEW.user_id,
    v_total_votes,
    v_unique_weeks,
    COALESCE(v_week_intervals, ARRAY[]::TEXT[]),
    v_first_vote,
    v_last_vote,
    v_unique_weeks >= 2
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_votes_count = v_total_votes,
    unique_weeks_count = v_unique_weeks,
    voting_week_intervals = COALESCE(v_week_intervals, ARRAY[]::TEXT[]),
    first_vote_at = v_first_vote,
    last_vote_at = v_last_vote,
    is_regular_voter = v_unique_weeks >= 2,
    updated_at = now();
  
  -- Automatically assign 'regular' role if user voted in 2+ different weeks
  IF v_unique_weeks >= 2 THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'regular')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_voting_stats_on_rating
AFTER INSERT ON public.contestant_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_voting_stats();