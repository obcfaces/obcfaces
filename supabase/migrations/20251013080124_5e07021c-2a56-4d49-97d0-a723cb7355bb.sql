-- ==========================================
-- Миграция: Переход на UTC для всех дневных статистик
-- ==========================================

-- 1) Пересоздаем get_daily_application_stats с UTC вместо Asia/Manila
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
  -- Get Monday of current week in UTC
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
  submitted_apps AS (
    -- Count applications SUBMITTED on each day (UTC)
    SELECT 
      DATE(submitted_at) as submit_date,
      COUNT(*)::bigint as total_count
    FROM weekly_contest_participants
    WHERE 
      deleted_at IS NULL
      AND DATE(submitted_at) >= week_start
      AND DATE(submitted_at) <= week_start + INTERVAL '6 days'
    GROUP BY DATE(submitted_at)
  ),
  status_changes AS (
    -- Extract status changes from status_history
    SELECT 
      wcp.id,
      key as status,
      (value->>'changed_at')::timestamp with time zone as changed_at_utc
    FROM weekly_contest_participants wcp,
    LATERAL jsonb_each(COALESCE(wcp.status_history, '{}'::jsonb))
    WHERE 
      deleted_at IS NULL
      AND value ? 'changed_at'
      AND key IN ('pre next week', 'next week', 'this week', 'past', 'rejected')
  ),
  reserved_changes AS (
    -- Count applications that got RESERVED (pre/next/this week statuses) on each day (UTC)
    SELECT 
      DATE(changed_at_utc) as change_date,
      COUNT(DISTINCT id)::bigint as reserved_count
    FROM status_changes
    WHERE 
      status IN ('pre next week', 'next week', 'this week', 'past')
      AND DATE(changed_at_utc) >= week_start
      AND DATE(changed_at_utc) <= week_start + INTERVAL '6 days'
    GROUP BY DATE(changed_at_utc)
  ),
  rejected_changes AS (
    -- Count applications that got REJECTED status on each day (UTC)
    SELECT 
      DATE(changed_at_utc) as change_date,
      COUNT(DISTINCT id)::bigint as rejected_count
    FROM status_changes
    WHERE 
      status = 'rejected'
      AND DATE(changed_at_utc) >= week_start
      AND DATE(changed_at_utc) <= week_start + INTERVAL '6 days'
    GROUP BY DATE(changed_at_utc)
  )
  SELECT 
    wd.day_name,
    wd.date::date::text as day_date,
    COALESCE(sa.total_count, 0) as total_applications,
    COALESCE(rc_reserved.reserved_count, 0) as approved_applications,
    COALESCE(rc_reserved.reserved_count, 0) as status_changed_count,
    COALESCE(rc_rejected.rejected_count, 0) as rejected_count,
    wd.day_of_week,
    wd.sort_order
  FROM week_dates wd
  LEFT JOIN submitted_apps sa ON sa.submit_date = wd.date::date
  LEFT JOIN reserved_changes rc_reserved ON rc_reserved.change_date = wd.date::date
  LEFT JOIN rejected_changes rc_rejected ON rc_rejected.change_date = wd.date::date
  ORDER BY wd.sort_order;
END;
$$;