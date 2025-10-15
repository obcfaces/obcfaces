-- Create function to get next week vote statistics
CREATE OR REPLACE FUNCTION public.get_next_week_votes_summary()
RETURNS TABLE(
  candidate_name text,
  likes_count bigint,
  dislikes_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    candidate_name,
    COALESCE(SUM(CASE WHEN vote_type = 'like' THEN 1 ELSE 0 END), 0) as likes_count,
    COALESCE(SUM(CASE WHEN vote_type = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes_count
  FROM next_week_votes
  GROUP BY candidate_name;
$$;