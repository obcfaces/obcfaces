-- Create function to get users that current user has liked
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
  SELECT 
    l.id as like_id,
    p.id as liked_user_id,
    p.display_name,
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
  JOIN profiles p ON (
    -- For contest likes, extract user_id from content_id format: "contestant-photo-{user_id}-{photo_number}"
    CASE 
      WHEN l.content_type = 'contest' AND l.content_id LIKE 'contestant-photo-%' THEN 
        (regexp_split_to_array(l.content_id, '-'))[3]::uuid
      ELSE null
    END = p.id
  )
  WHERE l.user_id = target_user_id
    AND l.content_type = 'contest'
    AND p.is_approved = true
  ORDER BY l.created_at DESC;
$function$;

-- Create function to get users who liked current user's content
CREATE OR REPLACE FUNCTION public.get_users_who_liked_me(target_user_id uuid)
RETURNS TABLE(
  like_id uuid,
  liker_user_id uuid,
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
  SELECT 
    l.id as like_id,
    p.id as liker_user_id,
    p.display_name,
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
  JOIN profiles p ON l.user_id = p.id
  WHERE l.content_type = 'contest'
    AND l.content_id LIKE CONCAT('contestant-photo-', target_user_id, '-%')
    AND p.is_approved = true
  ORDER BY l.created_at DESC;
$function$;