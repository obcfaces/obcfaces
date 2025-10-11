-- Fix Function Search Path warnings by setting search_path
-- This prevents SQL injection attacks

-- Fix get_contestant_average_rating
CREATE OR REPLACE FUNCTION public.get_contestant_average_rating(contestant_name_param TEXT)
RETURNS NUMERIC 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM contestant_ratings
  WHERE contestant_name = contestant_name_param;
$$;

-- Fix update_participant_ratings
CREATE OR REPLACE FUNCTION update_participant_ratings()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_contestant_ratings_participant_id 
ON contestant_ratings(participant_id);

CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_admin_status 
ON weekly_contest_participants(admin_status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_weekly_contest_participants_week_interval 
ON weekly_contest_participants(week_interval) 
WHERE deleted_at IS NULL AND is_active = true;