-- Drop and recreate the participant_stats materialized view without SECURITY DEFINER
-- This addresses the Security Definer View linter error

DROP MATERIALIZED VIEW IF EXISTS public.participant_stats;

-- Recreate the materialized view without SECURITY DEFINER (uses SECURITY INVOKER by default)
CREATE MATERIALIZED VIEW public.participant_stats AS
SELECT 
  wcp.user_id,
  wcp.contest_id,
  COALESCE(AVG(cr.rating), 0) AS avg_rating,
  COUNT(cr.rating) AS total_ratings,
  (wcp.application_data->>'first_name') AS first_name,
  (wcp.application_data->>'last_name') AS last_name,
  wc.week_start_date,
  wc.week_end_date,
  wc.status AS contest_status
FROM weekly_contest_participants wcp
LEFT JOIN contestant_ratings cr ON cr.contestant_user_id = wcp.user_id
LEFT JOIN weekly_contests wc ON wc.id = wcp.contest_id
WHERE wcp.is_active = true
GROUP BY wcp.user_id, wcp.contest_id, wcp.application_data, wc.week_start_date, wc.week_end_date, wc.status;

-- Create index for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_stats_user_contest 
ON public.participant_stats (user_id, contest_id);

-- Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_participant_stats_week_start 
ON public.participant_stats (week_start_date);

CREATE INDEX IF NOT EXISTS idx_participant_stats_rating 
ON public.participant_stats (avg_rating DESC);

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW public.participant_stats OWNER TO postgres;

-- Add comment explaining the security model
COMMENT ON MATERIALIZED VIEW public.participant_stats IS 
'Materialized view for participant statistics. Uses default security model (SECURITY INVOKER) to respect user permissions and RLS policies.';

-- Update the refresh function to ensure it doesn't use SECURITY DEFINER either
CREATE OR REPLACE FUNCTION public.refresh_participant_stats()
RETURNS void
LANGUAGE sql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.participant_stats;
$$;