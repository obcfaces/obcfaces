-- Update function to get users that current user has liked
-- Fix to work with current week participants and handle name matching better
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
  JOIN weekly_contest_participants wcp ON (
    -- Extract name from content_id and match with participant data
    CASE 
      WHEN l.content_id LIKE 'contestant-card-%' THEN 
        substring(l.content_id from 'contestant-card-(.+)')
      WHEN l.content_id LIKE 'contestant-photo-%-[0-9]' THEN 
        substring(l.content_id from 'contestant-photo-(.+)-[0-9]')
      ELSE null
    END = TRIM(CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', '')))
  )
  JOIN profiles p ON wcp.user_id = p.id
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  WHERE l.user_id = target_user_id
    AND l.content_type = 'contest'
    AND p.is_approved = true
    AND wc.status = 'active'
    AND CURRENT_DATE BETWEEN wc.week_start_date AND wc.week_end_date
  ORDER BY p.id, l.created_at DESC;
$function$;

-- Update function to get users who liked current user's content
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
  JOIN profiles p ON l.user_id = p.id
  JOIN weekly_contest_participants wcp_target ON p.id = wcp_target.user_id  
  JOIN weekly_contest_participants wcp_me ON target_user_id = wcp_me.user_id
  JOIN weekly_contests wc ON wcp_me.contest_id = wc.id
  WHERE l.content_type = 'contest'
    AND (
      -- Match contestant-card-{first_name} {last_name} format
      (l.content_id LIKE 'contestant-card-%' AND 
       l.content_id = CONCAT('contestant-card-', TRIM(CONCAT(COALESCE(wcp_me.application_data->>'first_name', ''), ' ', COALESCE(wcp_me.application_data->>'last_name', ''))))) OR
      -- Match contestant-photo-{first_name} {last_name}-{number} format  
      (l.content_id LIKE 'contestant-photo-%-[0-9]' AND 
       l.content_id LIKE CONCAT('contestant-photo-', TRIM(CONCAT(COALESCE(wcp_me.application_data->>'first_name', ''), ' ', COALESCE(wcp_me.application_data->>'last_name', ''))), '-%'))
    )
    AND p.is_approved = true
    AND wc.status = 'active'
    AND CURRENT_DATE BETWEEN wc.week_start_date AND wc.week_end_date
  ORDER BY l.created_at DESC;
$function$;