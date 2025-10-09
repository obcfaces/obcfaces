-- Fix get_daily_registration_stats to exclude users with 'suspicious' role
-- This ensures the table shows the same count as the filtered list

CREATE OR REPLACE FUNCTION public.get_daily_registration_stats()
RETURNS TABLE(
  day_name text, 
  registration_count bigint, 
  suspicious_count bigint, 
  day_of_week integer, 
  sort_order integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  week_start date;
  whitelisted_domains text[] := ARRAY['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com', 'aol.com', 'mail.com', 'zoho.com', 'yandex.ru', 'yandex.com'];
BEGIN
  -- Get Monday of current week
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
      COUNT(*)::bigint as registration_count,
      -- Count suspicious registrations (EXCLUDING users with 'suspicious' role)
      COUNT(*) FILTER (WHERE 
        -- 0. CRITICAL: Exclude users with 'suspicious' role
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.users.id 
          AND ur.role = 'suspicious'
        ) = FALSE
        AND (
          -- 1. Email domain not in whitelist
          (email IS NOT NULL AND SPLIT_PART(email, '@', 2) != ALL(whitelisted_domains))
          OR
          -- 2. Auto-confirmed email < 1 second
          (email_confirmed_at IS NOT NULL AND 
           ABS(EXTRACT(EPOCH FROM (email_confirmed_at - created_at))) < 1)
          OR
          -- 3. Duplicate fingerprint (more than 1 user with same fingerprint)
          EXISTS (
            SELECT 1 FROM user_device_fingerprints udf1
            WHERE udf1.user_id = auth.users.id
            AND (
              SELECT COUNT(DISTINCT user_id) 
              FROM user_device_fingerprints udf2 
              WHERE udf2.fingerprint_id = udf1.fingerprint_id
            ) > 1
          )
          OR
          -- 4. Fast form fill (< 5 seconds)
          (raw_user_meta_data->>'form_fill_time_seconds')::numeric < 5
        )
      )::bigint as suspicious_count
    FROM auth.users
    WHERE 
      -- Only count registrations from current week
      DATE(created_at AT TIME ZONE 'Asia/Manila') >= week_start
      AND DATE(created_at AT TIME ZONE 'Asia/Manila') <= week_start + INTERVAL '6 days'
    GROUP BY EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Manila'))
  )
  SELECT 
    wd.day_name,
    COALESCE(r.registration_count, 0) as registration_count,
    COALESCE(r.suspicious_count, 0) as suspicious_count,
    wd.day_of_week,
    wd.sort_order
  FROM week_dates wd
  LEFT JOIN registrations r ON wd.day_name = r.day_name
  ORDER BY wd.sort_order;
END;
$$;