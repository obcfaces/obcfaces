-- Add "Maybe Suspicious" row to registration statistics table
-- This shows users who meet suspicious criteria but are not explicitly marked as 'suspicious' role

CREATE OR REPLACE FUNCTION public.get_registration_stats_by_type()
RETURNS TABLE(stat_type text, mon bigint, tue bigint, wed bigint, thu bigint, fri bigint, sat bigint, sun bigint)
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
      -- Suspicious: Count ONLY users who have been explicitly marked with 'suspicious' role
      COUNT(*) FILTER (WHERE 
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.users.id 
          AND ur.role = 'suspicious'
        )
      )::bigint as suspicious_count,
      -- Maybe Suspicious: Users matching criteria but NOT marked as 'suspicious' role
      COUNT(*) FILTER (WHERE 
        -- NOT marked as 'suspicious' role
        NOT EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.users.id 
          AND ur.role = 'suspicious'
        )
        -- NOT OAuth users (they auto-confirm)
        AND raw_app_meta_data->>'provider' NOT IN ('google', 'facebook')
        AND (raw_user_meta_data->>'iss' IS NULL OR raw_user_meta_data->>'iss' NOT LIKE '%google%')
        -- Matches at least one suspicious criterion:
        AND (
          -- Auto-confirmed <1 sec
          (email_confirmed_at IS NOT NULL AND created_at IS NOT NULL 
           AND EXTRACT(EPOCH FROM (email_confirmed_at - created_at)) < 1)
          OR
          -- Fast form fill <5 sec
          ((raw_user_meta_data->>'form_fill_time_seconds')::numeric < 5)
          OR
          -- Duplicate fingerprint (5+ users) - checked via subquery
          (
            (raw_user_meta_data->>'fingerprint_id') IS NOT NULL
            AND (
              SELECT COUNT(*) 
              FROM auth.users u2 
              WHERE u2.raw_user_meta_data->>'fingerprint_id' = auth.users.raw_user_meta_data->>'fingerprint_id'
            ) >= 5
          )
        )
      )::bigint as maybe_suspicious_count
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
    'Maybe Suspicious'::text as stat_type,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 1), 0) as mon,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 2), 0) as tue,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 3), 0) as wed,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 4), 0) as thu,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 5), 0) as fri,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 6), 0) as sat,
    COALESCE((SELECT maybe_suspicious_count FROM daily_stats WHERE day_of_week = 0), 0) as sun
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