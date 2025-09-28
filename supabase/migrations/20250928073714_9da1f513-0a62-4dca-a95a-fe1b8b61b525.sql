-- Update function to show total applications per day and start with Monday
CREATE OR REPLACE FUNCTION get_daily_application_stats()
RETURNS TABLE(
  day_name text,
  new_count bigint,
  approved_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH week_dates AS (
    SELECT day_date, 
    CASE EXTRACT(DOW FROM day_date)
      WHEN 1 THEN 'Mon'
      WHEN 2 THEN 'Tue'
      WHEN 3 THEN 'Wed'
      WHEN 4 THEN 'Thu'
      WHEN 5 THEN 'Fri'
      WHEN 6 THEN 'Sat'
      WHEN 0 THEN 'Sun'
    END as day_name
    FROM generate_series(
      DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day',  -- Monday
      DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days', -- Sunday
      INTERVAL '1 day'
    ) as day_date
  ),
  daily_stats AS (
    SELECT 
      DATE_TRUNC('day', ca.submitted_at)::date as day_date,
      -- First number: TOTAL applications submitted on this day (any status)
      COUNT(*) FILTER (
        WHERE ca.is_active = true 
          AND ca.deleted_at IS NULL
      ) as new_count,
      -- Second number: approved applications on this day
      COUNT(*) FILTER (
        WHERE ca.status = 'approved'
          AND ca.is_active = true 
          AND ca.deleted_at IS NULL
      ) as approved_count
    FROM contest_applications ca
    WHERE ca.submitted_at >= DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day'
      AND ca.submitted_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '8 days'
      AND ca.is_active = true 
      AND ca.deleted_at IS NULL
    GROUP BY DATE_TRUNC('day', ca.submitted_at)::date
  )
  SELECT 
    wd.day_name,
    COALESCE(ds.new_count, 0) as new_count,
    COALESCE(ds.approved_count, 0) as approved_count
  FROM week_dates wd
  LEFT JOIN daily_stats ds ON wd.day_date::date = ds.day_date
  ORDER BY wd.day_date;
$function$;