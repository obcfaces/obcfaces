-- Create table for tracking user voting activity across weeks
CREATE TABLE IF NOT EXISTS public.user_voting_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_regular_voter BOOLEAN NOT NULL DEFAULT false,
  voting_week_intervals TEXT[] NOT NULL DEFAULT '{}',
  total_votes_count INTEGER NOT NULL DEFAULT 0,
  unique_weeks_count INTEGER NOT NULL DEFAULT 0,
  first_vote_at TIMESTAMP WITH TIME ZONE,
  last_vote_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_voting_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and moderators can view all voting stats"
  ON public.user_voting_stats
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role)
  );

CREATE POLICY "Users can view their own voting stats"
  ON public.user_voting_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage voting stats"
  ON public.user_voting_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update user voting stats when they vote
CREATE OR REPLACE FUNCTION public.update_user_voting_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vote_week_interval TEXT;
  voter_id UUID;
BEGIN
  -- Get the voter's user_id
  voter_id := NEW.user_id;
  
  -- Calculate week interval from created_at (vote date)
  vote_week_interval := (
    SELECT 
      TO_CHAR(date_trunc('week', NEW.created_at), 'DD/MM') || '-' ||
      TO_CHAR(date_trunc('week', NEW.created_at) + INTERVAL '6 days', 'DD/MM/YY')
  );
  
  -- Insert or update voting stats
  INSERT INTO public.user_voting_stats (
    user_id,
    voting_week_intervals,
    total_votes_count,
    unique_weeks_count,
    is_regular_voter,
    first_vote_at,
    last_vote_at
  )
  VALUES (
    voter_id,
    ARRAY[vote_week_interval],
    1,
    1,
    false,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- Add week interval if not already present
    voting_week_intervals = CASE 
      WHEN vote_week_interval = ANY(user_voting_stats.voting_week_intervals)
      THEN user_voting_stats.voting_week_intervals
      ELSE array_append(user_voting_stats.voting_week_intervals, vote_week_interval)
    END,
    total_votes_count = user_voting_stats.total_votes_count + 1,
    unique_weeks_count = CASE
      WHEN vote_week_interval = ANY(user_voting_stats.voting_week_intervals)
      THEN user_voting_stats.unique_weeks_count
      ELSE user_voting_stats.unique_weeks_count + 1
    END,
    -- Mark as regular if voted in 2+ different weeks
    is_regular_voter = CASE
      WHEN vote_week_interval = ANY(user_voting_stats.voting_week_intervals)
      THEN user_voting_stats.is_regular_voter
      ELSE (user_voting_stats.unique_weeks_count + 1) >= 2
    END,
    last_vote_at = NEW.created_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update voting stats on new ratings
DROP TRIGGER IF EXISTS update_voting_stats_on_rating ON public.contestant_ratings;
CREATE TRIGGER update_voting_stats_on_rating
  AFTER INSERT ON public.contestant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_voting_stats();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_voting_stats_user_id ON public.user_voting_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voting_stats_is_regular ON public.user_voting_stats(is_regular_voter);

COMMENT ON TABLE public.user_voting_stats IS 'Tracks user voting activity across different week intervals to identify regular voters';