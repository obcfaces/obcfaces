-- Create function to get voting statistics by email domain
CREATE OR REPLACE FUNCTION public.get_email_domain_voting_stats()
RETURNS TABLE(
  domain text,
  user_count bigint,
  total_votes bigint,
  total_likes bigint,
  avg_rating numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH domain_users AS (
    SELECT 
      LOWER(SUBSTRING(email FROM '@(.*)$')) as domain,
      id as user_id
    FROM auth.users
    WHERE email IS NOT NULL
  )
  SELECT 
    du.domain,
    COUNT(DISTINCT du.user_id) as user_count,
    COUNT(DISTINCT cr.id) as total_votes,
    COUNT(DISTINCT l.id) as total_likes,
    COALESCE(AVG(cr.rating), 0)::NUMERIC(3,1) as avg_rating
  FROM domain_users du
  LEFT JOIN contestant_ratings cr ON cr.user_id = du.user_id
  LEFT JOIN likes l ON l.user_id = du.user_id
  GROUP BY du.domain
  ORDER BY user_count DESC, du.domain ASC;
$$;