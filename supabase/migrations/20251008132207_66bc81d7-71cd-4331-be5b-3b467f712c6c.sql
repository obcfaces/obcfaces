-- Create new function for detailed registration statistics by type
CREATE OR REPLACE FUNCTION public.get_registration_stats_by_type()
RETURNS TABLE(
  stat_type text,
  mon bigint,
  tue bigint,
  wed bigint,
  thu bigint,
  fri bigint,
  sat bigint,
  sun bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  week_start date;
  whitelisted_domains text[] := ARRAY['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com', 'aol.com', 'mail.com', 'zoho.com', 'yandex.ru', 'yandex.com'];
BEGIN
  -- Get Monday of current week
  week_start := date_trunc('week', CURRENT_DATE)::date;
  
  RETURN QUERY
  WITH daily_stats AS (
    SELECT 
      EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Manila'))::int as day_of_week,
      -- Total count
      COUNT(*)::bigint as total_count,
      -- Verified email (email provider with confirmed email)
      COUNT(*) FILTER (WHERE 
        raw_app_meta_data->>'provider' = 'email' 
        AND email_confirmed_at IS NOT NULL
      )::bigint as email_verified_count,
      -- Unverified (no email confirmation)
      COUNT(*) FILTER (WHERE email_confirmed_at IS NULL)::bigint as unverified_count,
      -- Gmail OAuth
      COUNT(*) FILTER (WHERE 
        raw_app_meta_data->>'provider' = 'google'
        OR (raw_user_meta_data->>'iss' LIKE '%google%')
      )::bigint as gmail_count,
      -- Facebook OAuth
      COUNT(*) FILTER (WHERE 
        raw_app_meta_data->>'provider' = 'facebook'
      )::bigint as facebook_count,
      -- Suspicious (excluding those with suspicious role, and only non-OAuth)
      COUNT(*) FILTER (WHERE 
        NOT EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.users.id 
          AND ur.role = 'suspicious'
        )
        AND raw_app_meta_data->>'provider' != 'google'
        AND raw_app_meta_data->>'provider' != 'facebook'
        AND (
          -- Non-whitelisted email domain
          (email IS NOT NULL AND SPLIT_PART(email, '@', 2) != ALL(whitelisted_domains))
          OR
          -- Auto-confirmed < 1 second
          (email_confirmed_at IS NOT NULL AND 
           ABS(EXTRACT(EPOCH FROM (email_confirmed_at - created_at))) < 1)
          OR
          -- Duplicate fingerprint
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
          -- Fast form fill < 5 seconds
          (raw_user_meta_data->>'form_fill_time_seconds')::numeric < 5
        )
      )::bigint as suspicious_count
    FROM auth.users
    WHERE 
      DATE(created_at AT TIME ZONE 'Asia/Manila') >= week_start
      AND DATE(created_at AT TIME ZONE 'Asia/Manila') <= week_start + INTERVAL '6 days'
    GROUP BY EXTRACT(DOW FROM (created_at AT TIME ZONE 'Asia/Manila'))
  )
  SELECT 
    'Всего'::text as stat_type,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT total_count FROM daily_stats WHERE day_of_week = 0), 0) as sun
  UNION ALL
  SELECT 
    'Почта ✓'::text as stat_type,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT email_verified_count FROM daily_stats WHERE day_of_week = 0), 0) as sun
  UNION ALL
  SELECT 
    'Unverif'::text as stat_type,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT unverified_count FROM daily_stats WHERE day_of_week = 0), 0) as sun
  UNION ALL
  SELECT 
    'Gmail'::text as stat_type,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT gmail_count FROM daily_stats WHERE day_of_week = 0), 0) as sun
  UNION ALL
  SELECT 
    'Facebook'::text as stat_type,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT facebook_count FROM daily_stats WHERE day_of_week = 0), 0) as sun
  UNION ALL
  SELECT 
    'Suspicious'::text as stat_type,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT suspicious_count FROM daily_stats WHERE day_of_week = 0), 0) as sun;
END;
$$;