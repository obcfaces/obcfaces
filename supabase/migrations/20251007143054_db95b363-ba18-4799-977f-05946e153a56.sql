-- Create trigger function to update voting stats on new rating
CREATE OR REPLACE FUNCTION public.update_user_voting_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_votes INTEGER;
  v_unique_weeks INTEGER;
  v_week_intervals TEXT[];
  v_first_vote TIMESTAMP WITH TIME ZONE;
  v_last_vote TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate stats for this user
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(DISTINCT week_interval)::INTEGER,
    ARRAY_AGG(DISTINCT week_interval ORDER BY week_interval DESC),
    MIN(created_at),
    MAX(created_at)
  INTO 
    v_total_votes,
    v_unique_weeks,
    v_week_intervals,
    v_first_vote,
    v_last_vote
  FROM contestant_ratings
  WHERE user_id = NEW.user_id
    AND week_interval IS NOT NULL;

  -- Upsert voting stats
  INSERT INTO user_voting_stats (
    user_id,
    total_votes_count,
    unique_weeks_count,
    voting_week_intervals,
    first_vote_at,
    last_vote_at,
    is_regular_voter,
    updated_at
  )
  VALUES (
    NEW.user_id,
    v_total_votes,
    v_unique_weeks,
    v_week_intervals,
    v_first_vote,
    v_last_vote,
    v_unique_weeks >= 2,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_votes_count = EXCLUDED.total_votes_count,
    unique_weeks_count = EXCLUDED.unique_weeks_count,
    voting_week_intervals = EXCLUDED.voting_week_intervals,
    first_vote_at = EXCLUDED.first_vote_at,
    last_vote_at = EXCLUDED.last_vote_at,
    is_regular_voter = EXCLUDED.is_regular_voter,
    updated_at = now();
    
  -- Auto-assign regular role if user voted in 2+ weeks
  IF v_unique_weeks >= 2 THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'regular'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_voting_stats_on_rating
AFTER INSERT ON contestant_ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_voting_stats();