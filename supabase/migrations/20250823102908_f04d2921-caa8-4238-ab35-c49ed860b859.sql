-- Simplified working function for likes
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
  WITH user_likes AS (
    SELECT 
      l.id as like_id,
      l.content_id,
      l.content_type,
      l.created_at,
      TRIM(substring(l.content_id from 'contestant-card-(.+)')) as extracted_name
    FROM likes l
    WHERE l.user_id = target_user_id
      AND l.content_type = 'contest'
      AND l.content_id LIKE 'contestant-card-%'
  ),
  current_participants AS (
    SELECT 
      wcp.user_id,
      p.display_name,
      p.avatar_url,
      p.photo_1_url,
      p.photo_2_url,
      p.country,
      p.city,
      p.age,
      p.participant_type,
      TRIM(REGEXP_REPLACE(CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', '')), '\s+', ' ', 'g')) as participant_name
    FROM weekly_contest_participants wcp
    JOIN profiles p ON wcp.user_id = p.id
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    WHERE wc.status = 'active'
      AND CURRENT_DATE BETWEEN wc.week_start_date AND wc.week_end_date
      AND p.is_approved = true
  )
  SELECT DISTINCT ON (cp.user_id)
    ul.like_id,
    cp.user_id as liked_user_id,
    COALESCE(cp.display_name, cp.participant_name) as display_name,
    cp.avatar_url,
    cp.photo_1_url,
    cp.photo_2_url,
    cp.country,
    cp.city,
    cp.age,
    cp.participant_type,
    ul.content_type,
    ul.content_id,
    ul.created_at
  FROM user_likes ul
  JOIN current_participants cp ON ul.extracted_name = cp.participant_name
  ORDER BY cp.user_id, ul.created_at DESC;
$function$;