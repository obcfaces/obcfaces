-- Populate user_voting_stats with existing data from contestant_ratings
INSERT INTO public.user_voting_stats (
  user_id,
  voting_week_intervals,
  total_votes_count,
  unique_weeks_count,
  is_regular_voter,
  first_vote_at,
  last_vote_at
)
SELECT 
  user_id,
  ARRAY_AGG(DISTINCT vote_week_interval ORDER BY vote_week_interval) as voting_week_intervals,
  COUNT(*)::INTEGER as total_votes_count,
  COUNT(DISTINCT vote_week_interval)::INTEGER as unique_weeks_count,
  COUNT(DISTINCT vote_week_interval) >= 2 as is_regular_voter,
  MIN(created_at) as first_vote_at,
  MAX(created_at) as last_vote_at
FROM (
  SELECT 
    user_id,
    created_at,
    TO_CHAR(date_trunc('week', created_at), 'DD/MM') || '-' ||
    TO_CHAR(date_trunc('week', created_at) + INTERVAL '6 days', 'DD/MM/YY') as vote_week_interval
  FROM public.contestant_ratings
  WHERE created_at IS NOT NULL
) subquery
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  voting_week_intervals = EXCLUDED.voting_week_intervals,
  total_votes_count = EXCLUDED.total_votes_count,
  unique_weeks_count = EXCLUDED.unique_weeks_count,
  is_regular_voter = EXCLUDED.is_regular_voter,
  first_vote_at = EXCLUDED.first_vote_at,
  last_vote_at = EXCLUDED.last_vote_at,
  updated_at = NOW();