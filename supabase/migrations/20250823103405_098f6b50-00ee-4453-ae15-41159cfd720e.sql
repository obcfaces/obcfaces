-- Fix get_users_i_liked to show all real profiles regardless of contest participation
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
  )
  SELECT DISTINCT ON (p.id)
    ul.like_id,
    p.id as liked_user_id,
    COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
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
  JOIN profiles p ON (
    ul.extracted_name = TRIM(REGEXP_REPLACE(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')), '\s+', ' ', 'g'))
    OR ul.extracted_name = p.display_name
  )
  -- Remove the is_approved filter to show all real profiles
  WHERE p.id IS NOT NULL
  ORDER BY p.id, ul.created_at DESC;
$function$;