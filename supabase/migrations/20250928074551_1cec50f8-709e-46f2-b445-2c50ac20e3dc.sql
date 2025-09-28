-- Fix week calculation to properly start from Monday (22 Sept) to Sunday (28 Sept)
CREATE OR REPLACE FUNCTION public.get_week_monday(input_date date DEFAULT CURRENT_DATE)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    -- Calculate Monday of the week (ISO week, Monday = 1, Sunday = 7)
    CASE 
      WHEN EXTRACT(DOW FROM input_date) = 0 THEN input_date - INTERVAL '6 days'  -- If Sunday, go back 6 days to Monday
      ELSE input_date - INTERVAL '1 day' * (EXTRACT(DOW FROM input_date) - 1)    -- Go back to Monday
    END::DATE;
$function$;

-- Update daily application stats function with correct week calculation
CREATE OR REPLACE FUNCTION public.get_daily_application_stats()
 RETURNS TABLE(day_of_week integer, day_name text, total_applications bigint, approved_applications bigint, sort_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_week_start DATE;
BEGIN
  -- Get current week start (Monday)
  current_week_start := get_week_monday(CURRENT_DATE);
  
  RETURN QUERY
  WITH week_days AS (
    SELECT 
      day_num,
      current_week_start + (day_num * INTERVAL '1 day') as week_day,
      CASE day_num
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue' 
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END AS day_name,
      -- Sort order to display Mon-Sun
      (day_num + 1) as sort_order
    FROM generate_series(0, 6) AS day_num
  ),
  daily_applications AS (
    SELECT 
      DATE(ca.submitted_at) as application_date,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE ca.status = 'approved') as approved_count
    FROM contest_applications ca
    WHERE ca.submitted_at >= current_week_start
      AND ca.submitted_at < current_week_start + INTERVAL '7 days'
      AND ca.deleted_at IS NULL
    GROUP BY DATE(ca.submitted_at)
  )
  SELECT 
    wd.day_num as day_of_week,
    wd.day_name,
    COALESCE(da.total_count, 0) as total_applications,
    COALESCE(da.approved_count, 0) as approved_applications,
    wd.sort_order
  FROM week_days wd
  LEFT JOIN daily_applications da ON wd.week_day = da.application_date
  ORDER BY wd.sort_order;
END;
$function$;

-- Update daily voting stats function
CREATE OR REPLACE FUNCTION public.get_daily_voting_stats()
 RETURNS TABLE(day_of_week integer, day_name text, vote_count bigint, like_count bigint, sort_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_week_start DATE;
BEGIN
  -- Get current week start (Monday)
  current_week_start := get_week_monday(CURRENT_DATE);
  
  RETURN QUERY
  WITH week_days AS (
    SELECT 
      day_num,
      current_week_start + (day_num * INTERVAL '1 day') as week_day,
      CASE day_num
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue' 
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END AS day_name,
      -- Sort order to display Mon-Sun
      (day_num + 1) as sort_order
    FROM generate_series(0, 6) AS day_num
  ),
  daily_votes AS (
    SELECT 
      DATE(cr.created_at) as vote_date,
      COUNT(*) as vote_count
    FROM contestant_ratings cr
    WHERE cr.created_at >= current_week_start
      AND cr.created_at < current_week_start + INTERVAL '7 days'
    GROUP BY DATE(cr.created_at)
  ),
  daily_likes AS (
    SELECT 
      DATE(l.created_at) as like_date,
      COUNT(*) as like_count
    FROM likes l
    WHERE l.created_at >= current_week_start
      AND l.created_at < current_week_start + INTERVAL '7 days'
      AND l.content_type = 'contest'
    GROUP BY DATE(l.created_at)
  )
  SELECT 
    wd.day_num as day_of_week,
    wd.day_name,
    COALESCE(dv.vote_count, 0) as vote_count,
    COALESCE(dl.like_count, 0) as like_count,
    wd.sort_order
  FROM week_days wd
  LEFT JOIN daily_votes dv ON wd.week_day = dv.vote_date
  LEFT JOIN daily_likes dl ON wd.week_day = dl.like_date
  ORDER BY wd.sort_order;
END;
$function$;

-- Update daily registration stats function
CREATE OR REPLACE FUNCTION public.get_daily_registration_stats()
 RETURNS TABLE(day_of_week integer, day_name text, registration_count bigint, sort_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_week_start DATE;
BEGIN
  -- Get current week start (Monday)
  current_week_start := get_week_monday(CURRENT_DATE);
  
  RETURN QUERY
  WITH week_days AS (
    SELECT 
      day_num,
      current_week_start + (day_num * INTERVAL '1 day') as week_day,
      CASE day_num
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue' 
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END AS day_name,
      -- Sort order to display Mon-Sun
      (day_num + 1) as sort_order
    FROM generate_series(0, 6) AS day_num
  ),
  daily_registrations AS (
    SELECT 
      DATE(p.created_at) as registration_date,
      COUNT(*) as registration_count
    FROM profiles p
    WHERE p.created_at >= current_week_start
      AND p.created_at < current_week_start + INTERVAL '7 days'
    GROUP BY DATE(p.created_at)
  )
  SELECT 
    wd.day_num as day_of_week,
    wd.day_name,
    COALESCE(dr.registration_count, 0) as registration_count,
    wd.sort_order
  FROM week_days wd
  LEFT JOIN daily_registrations dr ON wd.week_day = dr.registration_date
  ORDER BY wd.sort_order;
END;
$function$;