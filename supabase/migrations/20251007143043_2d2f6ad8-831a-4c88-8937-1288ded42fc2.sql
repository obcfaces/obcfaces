-- Fix the trigger function - remove reference to non-existent contestant_user_id column
DROP TRIGGER IF EXISTS auto_assign_regular_role_trigger ON contestant_ratings;
DROP FUNCTION IF EXISTS public.auto_assign_regular_role();
DROP TRIGGER IF EXISTS update_voting_stats_on_rating ON contestant_ratings;
DROP FUNCTION IF EXISTS public.update_user_voting_stats();

-- Recreate user_voting_stats table with correct structure
DROP TABLE IF EXISTS public.user_voting_stats CASCADE;

CREATE TABLE public.user_voting_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_votes_count INTEGER NOT NULL DEFAULT 0,
  unique_weeks_count INTEGER NOT NULL DEFAULT 0,
  voting_week_intervals TEXT[] NOT NULL DEFAULT '{}',
  first_vote_at TIMESTAMP WITH TIME ZONE,
  last_vote_at TIMESTAMP WITH TIME ZONE,
  is_regular_voter BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_voting_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own voting stats"
ON public.user_voting_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins and moderators can view all voting stats"
ON public.user_voting_stats FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "System can manage voting stats"
ON public.user_voting_stats FOR ALL
USING (true)
WITH CHECK (true);

-- Populate user_voting_stats from contestant_ratings
INSERT INTO public.user_voting_stats (
  user_id,
  total_votes_count,
  unique_weeks_count,
  voting_week_intervals,
  first_vote_at,
  last_vote_at,
  is_regular_voter
)
SELECT 
  user_id,
  COUNT(*)::INTEGER as total_votes_count,
  COUNT(DISTINCT week_interval)::INTEGER as unique_weeks_count,
  ARRAY_AGG(DISTINCT week_interval ORDER BY week_interval DESC) as voting_week_intervals,
  MIN(created_at) as first_vote_at,
  MAX(created_at) as last_vote_at,
  (COUNT(DISTINCT week_interval) >= 2) as is_regular_voter
FROM contestant_ratings
WHERE week_interval IS NOT NULL
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_votes_count = EXCLUDED.total_votes_count,
  unique_weeks_count = EXCLUDED.unique_weeks_count,
  voting_week_intervals = EXCLUDED.voting_week_intervals,
  first_vote_at = EXCLUDED.first_vote_at,
  last_vote_at = EXCLUDED.last_vote_at,
  is_regular_voter = EXCLUDED.is_regular_voter,
  updated_at = now();