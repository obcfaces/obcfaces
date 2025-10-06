-- Drop existing function and create new one with correct signature
DROP FUNCTION IF EXISTS public.get_daily_registration_stats();

CREATE OR REPLACE FUNCTION public.get_daily_registration_stats()
RETURNS TABLE (
  day_name text,
  registration_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_week AS (
    -- Get Monday of current week
    SELECT date_trunc('week', CURRENT_DATE)::date as week_start
  ),
  week_dates AS (
    -- Generate all 7 days of the week (Monday to Sunday)
    SELECT 
      (SELECT week_start FROM current_week) + (d || ' days')::interval as date,
      CASE d
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue'
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END as day_name
    FROM generate_series(0, 6) as d
  ),
  registrations AS (
    -- Count registrations per day in Asia/Manila timezone
    SELECT 
      CASE EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Manila'))
        WHEN 1 THEN 'Mon'
        WHEN 2 THEN 'Tue'
        WHEN 3 THEN 'Wed'
        WHEN 4 THEN 'Thu'
        WHEN 5 THEN 'Fri'
        WHEN 6 THEN 'Sat'
        WHEN 0 THEN 'Sun'
      END as day_name,
      COUNT(*)::bigint as registration_count
    FROM auth.users
    WHERE 
      -- Only count registrations from current week
      DATE(created_at AT TIME ZONE 'Asia/Manila') >= (SELECT week_start FROM current_week)
      AND DATE(created_at AT TIME ZONE 'Asia/Manila') <= (SELECT week_start FROM current_week) + INTERVAL '6 days'
    GROUP BY EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Manila'))
  )
  SELECT 
    wd.day_name,
    COALESCE(r.registration_count, 0) as registration_count
  FROM week_dates wd
  LEFT JOIN registrations r ON wd.day_name = r.day_name
  ORDER BY 
    CASE wd.day_name
      WHEN 'Mon' THEN 1
      WHEN 'Tue' THEN 2
      WHEN 'Wed' THEN 3
      WHEN 'Thu' THEN 4
      WHEN 'Fri' THEN 5
      WHEN 'Sat' THEN 6
      WHEN 'Sun' THEN 7
    END;
$$;