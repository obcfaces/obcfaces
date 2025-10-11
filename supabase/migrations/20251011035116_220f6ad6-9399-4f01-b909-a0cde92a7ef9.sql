-- Drop and recreate function to get daily application statistics
DROP FUNCTION IF EXISTS public.get_daily_application_stats();

CREATE OR REPLACE FUNCTION public.get_daily_application_stats()
RETURNS TABLE (
  day_name text,
  day_date text,
  total_applications bigint,
  approved_applications bigint,
  status_changed_count bigint,
  rejected_count bigint,
  day_of_week integer,
  sort_order integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start date;
BEGIN
  -- Get Monday of current week (same as registration stats)
  week_start := date_trunc('week', CURRENT_DATE)::date;
  
  RETURN QUERY
  WITH week_dates AS (
    -- Generate all 7 days of the week (Monday to Sunday)
    SELECT 
      week_start + (d || ' days')::interval as date,
      CASE d
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue'
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END as day_name,
      d + 1 as day_of_week,
      d as sort_order
    FROM generate_series(0, 6) as d
  ),
  applications AS (
    -- Count applications per day in Asia/Manila timezone
    SELECT 
      CASE EXTRACT(DOW FROM (submitted_at AT TIME ZONE 'Asia/Manila'))
        WHEN 1 THEN 'Mon'
        WHEN 2 THEN 'Tue'
        WHEN 3 THEN 'Wed'
        WHEN 4 THEN 'Thu'
        WHEN 5 THEN 'Fri'
        WHEN 6 THEN 'Sat'
        WHEN 0 THEN 'Sun'
      END as day_name,
      -- Total applications submitted this day
      COUNT(*)::bigint as total_count,
      -- Applications submitted this day that NOW have approved status
      COUNT(*) FILTER (WHERE 
        admin_status IN ('pre next week', 'next week', 'next week on site', 'this week', 'past')
      )::bigint as approved_count,
      -- Applications submitted this day that NOW have rejected status
      COUNT(*) FILTER (WHERE 
        admin_status = 'rejected'
      )::bigint as rejected_count
    FROM weekly_contest_participants
    WHERE 
      deleted_at IS NULL
      -- Only count applications from current week
      AND DATE(submitted_at AT TIME ZONE 'Asia/Manila') >= week_start
      AND DATE(submitted_at AT TIME ZONE 'Asia/Manila') <= week_start + INTERVAL '6 days'
    GROUP BY EXTRACT(DOW FROM (submitted_at AT TIME ZONE 'Asia/Manila'))
  )
  SELECT 
    wd.day_name,
    (week_start + (wd.sort_order || ' days')::interval)::date::text as day_date,
    COALESCE(a.total_count, 0) as total_applications,
    COALESCE(a.approved_count, 0) as approved_applications,
    COALESCE(a.approved_count, 0) as status_changed_count,
    COALESCE(a.rejected_count, 0) as rejected_count,
    wd.day_of_week,
    wd.sort_order
  FROM week_dates wd
  LEFT JOIN applications a ON wd.day_name = a.day_name
  ORDER BY wd.sort_order;
END;
$$;