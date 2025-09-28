-- Create function to get next week applications count
CREATE OR REPLACE FUNCTION get_next_week_applications_count()
RETURNS TABLE(
  total_applications bigint,
  next_week_applications bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (
      WHERE wcp.admin_status IN ('next week', 'next week on site')
    ) as next_week_applications
  FROM contest_applications ca
  LEFT JOIN weekly_contest_participants wcp ON wcp.user_id = ca.user_id
  WHERE ca.is_active = true 
    AND ca.deleted_at IS NULL
    AND ca.status IN ('approved', 'pending', 'under_review');
$function$;