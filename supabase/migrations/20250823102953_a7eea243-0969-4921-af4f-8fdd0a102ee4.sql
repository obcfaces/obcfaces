-- Rewrite function to work directly with profiles table since weekly_contest_participants is empty
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
  participants AS (
    SELECT 
      p.id as user_id,
      p.display_name,
      p.avatar_url,
      p.photo_1_url,
      p.photo_2_url,
      p.country,
      p.city,
      p.age,
      p.participant_type,
      TRIM(REGEXP_REPLACE(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')), '\s+', ' ', 'g')) as participant_name
    FROM profiles p
    WHERE p.is_contest_participant = true
      AND p.is_approved = true
  )
  SELECT DISTINCT ON (p.user_id)
    ul.like_id,
    p.user_id as liked_user_id,
    COALESCE(p.display_name, p.participant_name) as display_name,
    p.avatar_url,
    p.photo_1_url,
    p.photo_2_url,
    p.country,
    p.city,
    p.age,
    p.participant_type,
    ul.content_type,
    ul.content_id,
    ul.created_at
  FROM user_likes ul
  JOIN participants p ON ul.extracted_name = p.participant_name
  ORDER BY p.user_id, ul.created_at DESC;
$function$;