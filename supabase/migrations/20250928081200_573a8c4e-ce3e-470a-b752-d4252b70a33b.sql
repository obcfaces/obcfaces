-- Update the get_user_rating_stats function to only consider the latest rating from each user
CREATE OR REPLACE FUNCTION public.get_user_rating_stats(target_user_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint, user_has_voted boolean)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH latest_ratings AS (
    SELECT DISTINCT ON (user_id) 
      user_id,
      rating,
      created_at
    FROM contestant_ratings 
    WHERE contestant_user_id = target_user_id
    ORDER BY user_id, created_at DESC
  )
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*)::BIGINT as total_votes,
    EXISTS(
      SELECT 1 FROM latest_ratings 
      WHERE user_id = auth.uid()
    ) as user_has_voted
  FROM latest_ratings;
$$;