-- Remove materialized view from API access to fix Security Definer View error
-- Since materialized views can't have RLS, we'll restrict API access and provide secure functions instead

-- Revoke all access to the materialized view from API users
REVOKE ALL ON public.participant_stats FROM anon, authenticated;

-- Grant access only to the service role for internal use
GRANT SELECT ON public.participant_stats TO service_role;

-- Create a secure function to access participant statistics that respects permissions
CREATE OR REPLACE FUNCTION public.get_participant_statistics(contest_week_offset integer DEFAULT 0)
RETURNS TABLE(
  user_id uuid, 
  contest_id uuid, 
  avg_rating numeric, 
  total_ratings bigint, 
  first_name text, 
  last_name text,
  week_start_date date,
  week_end_date date,
  contest_status text
)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT 
    ps.user_id,
    ps.contest_id,
    ps.avg_rating,
    ps.total_ratings,
    ps.first_name,
    ps.last_name,
    ps.week_start_date,
    ps.week_end_date,
    ps.contest_status
  FROM participant_stats ps
  WHERE ps.week_start_date = (
    SELECT week_start_date 
    FROM weekly_contests 
    ORDER BY week_start_date DESC 
    OFFSET ABS(contest_week_offset) 
    LIMIT 1
  )
  ORDER BY ps.avg_rating DESC, ps.total_ratings DESC;
$$;

-- Add documentation
COMMENT ON FUNCTION public.get_participant_statistics(integer) IS 
'Secure function to access participant statistics. Uses SECURITY INVOKER to respect RLS policies.';

COMMENT ON MATERIALIZED VIEW public.participant_stats IS 
'Internal materialized view for performance. Access restricted to service role. Use get_participant_statistics() function for API access.';