-- Simplified function to debug the likes issue
CREATE OR REPLACE FUNCTION public.get_users_i_liked_debug(target_user_id uuid)
RETURNS TABLE(
  like_id uuid,
  content_id text,
  extracted_name text,
  participant_name text,
  user_id uuid,
  display_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    l.id as like_id,
    l.content_id,
    TRIM(substring(l.content_id from 'contestant-card-(.+)')) as extracted_name,
    TRIM(REGEXP_REPLACE(CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', '')), '\s+', ' ', 'g')) as participant_name,
    wcp.user_id,
    p.display_name
  FROM likes l
  CROSS JOIN weekly_contest_participants wcp
  JOIN profiles p ON wcp.user_id = p.id
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  WHERE l.user_id = target_user_id
    AND l.content_type = 'contest'
    AND l.content_id LIKE 'contestant-card-%'
    AND wc.status = 'active'
    AND CURRENT_DATE BETWEEN wc.week_start_date AND wc.week_end_date
  ORDER BY l.created_at DESC;
$function$;