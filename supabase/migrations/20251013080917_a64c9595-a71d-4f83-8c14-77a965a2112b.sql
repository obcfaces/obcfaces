-- 1) Create WITA week start function
CREATE OR REPLACE FUNCTION public.week_start_wita(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT DATE_TRUNC('week', ts AT TIME ZONE 'Asia/Makassar')
         AT TIME ZONE 'Asia/Makassar';
$$;

-- 2) Create weekly jobs table for idempotency
CREATE TABLE IF NOT EXISTS public.weekly_jobs (
  week_start TIMESTAMPTZ PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_details JSONB
);

-- Enable RLS on weekly_jobs
ALTER TABLE public.weekly_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can view job history
CREATE POLICY "Admins can view weekly jobs"
  ON public.weekly_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- System can insert job records
CREATE POLICY "System can insert weekly jobs"
  ON public.weekly_jobs
  FOR INSERT
  WITH CHECK (true);

-- 3) Clean up remaining 'next week on site' → 'next week'
UPDATE public.weekly_contest_participants
SET admin_status = 'next week'
WHERE admin_status = 'next week on site';

-- 4) Fix past.week_start for "1 week ago" (using heuristic approach)
-- Set week_start to previous week for past records that have current week
UPDATE public.weekly_contest_participants
SET week_start = public.week_start_wita(now() - interval '1 week')
WHERE admin_status = 'past'
  AND (
    week_start IS NULL 
    OR week_start = public.week_start_wita(now())
  );

-- 5) Set week_start for current 'this week' participants
UPDATE public.weekly_contest_participants
SET week_start = public.week_start_wita(now())
WHERE admin_status = 'this week'
  AND week_start IS NULL;

-- 6) Set preview_week_start for current 'next week' participants
UPDATE public.weekly_contest_participants
SET preview_week_start = public.week_start_wita(now())
WHERE admin_status = 'next week'
  AND preview_week_start IS NULL;

-- 7) Create verification queries as a helper function
CREATE OR REPLACE FUNCTION public.verify_weekly_migration()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  count BIGINT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Check 1: No 'next week on site' remaining
  RETURN QUERY
  SELECT 
    'no_next_week_on_site'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'FAIL' END::TEXT,
    COUNT(*)::BIGINT,
    'Should be 0'::TEXT
  FROM weekly_contest_participants
  WHERE admin_status = 'next week on site';

  -- Check 2: All 'this week' have current week_start
  RETURN QUERY
  SELECT 
    'this_week_intervals'::TEXT,
    CASE WHEN COUNT(*) FILTER (WHERE week_start = week_start_wita(now())) = COUNT(*) 
         THEN 'OK' ELSE 'FAIL' END::TEXT,
    COUNT(*)::BIGINT,
    FORMAT('OK: %s, Missing: %s',
      COUNT(*) FILTER (WHERE week_start = week_start_wita(now())),
      COUNT(*) FILTER (WHERE week_start IS NULL OR week_start != week_start_wita(now()))
    )::TEXT
  FROM weekly_contest_participants
  WHERE admin_status = 'this week';

  -- Check 3: No 'past' with current week_start
  RETURN QUERY
  SELECT 
    'past_no_current_week'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'FAIL' END::TEXT,
    COUNT(*)::BIGINT,
    'Should be 0'::TEXT
  FROM weekly_contest_participants
  WHERE admin_status = 'past'
    AND week_start = week_start_wita(now());

  -- Check 4: Distribution of past weeks
  RETURN QUERY
  SELECT 
    'past_distribution'::TEXT,
    'INFO'::TEXT,
    COUNT(DISTINCT week_start)::BIGINT,
    'Number of unique weeks in past'::TEXT
  FROM weekly_contest_participants
  WHERE admin_status = 'past';
END;
$$;