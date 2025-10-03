-- Drop old functions that reference contest_applications table
DROP FUNCTION IF EXISTS get_card_section_stats() CASCADE;
DROP FUNCTION IF EXISTS get_contest_applications_admin(boolean) CASCADE;
DROP FUNCTION IF EXISTS get_daily_application_stats() CASCADE;
DROP FUNCTION IF EXISTS get_next_week_applications_count() CASCADE;

-- Create new function for card section stats using weekly_contest_participants
CREATE OR REPLACE FUNCTION public.get_card_section_stats()
RETURNS TABLE(
  new_applications_count bigint,
  moved_to_next_week_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- Count new applications (pending status)
    COUNT(*) FILTER (
      WHERE admin_status = 'pending'
        AND is_active = true 
        AND deleted_at IS NULL
    ) as new_applications_count,
    
    -- Count applications moved to next week statuses
    COUNT(*) FILTER (
      WHERE admin_status IN ('next week', 'next week on site')
        AND is_active = true 
        AND deleted_at IS NULL
    ) as moved_to_next_week_count
    
  FROM weekly_contest_participants;
$$;

-- Create function to get daily application stats
CREATE OR REPLACE FUNCTION public.get_daily_application_stats()
RETURNS TABLE(
  day_name text,
  day_date date,
  total_applications bigint,
  approved_applications bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    TO_CHAR(date_series, 'Dy') as day_name,
    date_series::date as day_date,
    COALESCE(COUNT(wcp.id), 0) as total_applications,
    COALESCE(COUNT(wcp.id) FILTER (WHERE wcp.admin_status IN ('next week', 'this week', 'next week on site')), 0) as approved_applications
  FROM generate_series(
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS date_series
  LEFT JOIN weekly_contest_participants wcp ON 
    DATE(wcp.submitted_at) = date_series::date
    AND wcp.is_active = true
    AND wcp.deleted_at IS NULL
  GROUP BY date_series
  ORDER BY date_series;
$$;

-- Create function to get next week applications count
CREATE OR REPLACE FUNCTION public.get_next_week_applications_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::bigint
  FROM weekly_contest_participants
  WHERE admin_status IN ('next week', 'next week on site')
    AND is_active = true
    AND deleted_at IS NULL;
$$;