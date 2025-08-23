-- Fix the main function using the working logic from debug function
CREATE OR REPLACE FUNCTION public.get_users_i_liked(target_user_id uuid)
RETURNS TABLE(
  like_id uuid,
  liked_user_id uuid,
  display_name text,
  avatar_url text,
  photo_1_url text,
  photo_2_url text,
  country text,
  city text,
  age integer,
  participant_type text,
  content_type text,
  content_id text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT ON (p.id)
    l.id as like_id,
    p.id as liked_user_id,
    COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
    p.avatar_url,
    p.photo_1_url,
    p.photo_2_url,
    p.country,
    p.city,
    p.age,
    p.participant_type,
    l.content_type,
    l.content_id,
    l.created_at
  FROM likes l
  CROSS JOIN weekly_contest_participants wcp
  JOIN profiles p ON wcp.user_id = p.id
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  WHERE l.user_id = target_user_id
    AND l.content_type = 'contest'
    AND l.content_id LIKE 'contestant-card-%'
    AND wc.status = 'active'
    AND CURRENT_DATE BETWEEN wc.week_start_date AND wc.week_end_date
    AND (
      -- Match the extracted name with any participant name
      TRIM(substring(l.content_id from 'contestant-card-(.+)')) = 
      TRIM(REGEXP_REPLACE(CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', '')), '\s+', ' ', 'g'))
    )
    AND p.is_approved = true
  ORDER BY p.id, l.created_at DESC;
$function$;