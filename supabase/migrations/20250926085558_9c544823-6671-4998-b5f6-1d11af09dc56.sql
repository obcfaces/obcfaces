-- Create function to get daily registration statistics
CREATE OR REPLACE FUNCTION public.get_daily_registration_stats()
RETURNS TABLE(day_of_week integer, day_name text, registration_count bigint, verified_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH week_dates AS (
    SELECT 
      dow,
      CASE dow
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue' 
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END AS day_name
    FROM generate_series(0, 6) AS dow
  ),
  daily_registrations AS (
    SELECT 
      EXTRACT(DOW FROM p.created_at) AS dow,
      COUNT(*) as registration_count
    FROM profiles p
    WHERE p.created_at >= date_trunc('week', CURRENT_DATE)
      AND p.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
    GROUP BY EXTRACT(DOW FROM p.created_at)
  ),
  daily_verified AS (
    SELECT 
      EXTRACT(DOW FROM p.created_at) AS dow,
      COUNT(*) as verified_count
    FROM profiles p
    WHERE p.created_at >= date_trunc('week', CURRENT_DATE)
      AND p.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      AND EXISTS (
        SELECT 1 FROM auth.users au 
        WHERE au.id = p.id 
        AND au.email_confirmed_at IS NOT NULL
      )
    GROUP BY EXTRACT(DOW FROM p.created_at)
  )
  
  SELECT 
    wd.dow as day_of_week,
    wd.day_name,
    COALESCE(dr.registration_count, 0) as registration_count,
    COALESCE(dv.verified_count, 0) as verified_count
  FROM week_dates wd
  LEFT JOIN daily_registrations dr ON (wd.dow = CASE WHEN dr.dow = 0 THEN 6 ELSE dr.dow - 1 END)
  LEFT JOIN daily_verified dv ON (wd.dow = CASE WHEN dv.dow = 0 THEN 6 ELSE dv.dow - 1 END)
  ORDER BY wd.dow;
END;
$function$