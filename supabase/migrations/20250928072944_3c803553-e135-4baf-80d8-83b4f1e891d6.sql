-- Create function to get card section statistics
CREATE OR REPLACE FUNCTION get_card_section_stats()
RETURNS TABLE(
  new_applications_count bigint,
  moved_to_next_week_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    -- Count new applications (pending, under_review)
    COUNT(*) FILTER (
      WHERE ca.status IN ('pending', 'under_review')
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    ) as new_applications_count,
    
    -- Count applications moved to next week statuses
    COUNT(*) FILTER (
      WHERE wcp.admin_status IN ('next week', 'next week on site')
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    ) as moved_to_next_week_count
    
  FROM contest_applications ca
  LEFT JOIN weekly_contest_participants wcp ON wcp.user_id = ca.user_id;
$function$;