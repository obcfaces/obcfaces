-- Check current function and fix the logic
DROP FUNCTION IF EXISTS public.get_users_who_liked_me(uuid);

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
  state text,
  age integer, 
  weight_kg numeric,
  height_cm integer,
  participant_type text, 
  content_type text, 
  content_id text, 
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Get users who liked the target user's contest content
  WITH target_user_info AS (
    SELECT 
      COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as target_name,
      p.first_name,
      p.last_name
    FROM profiles p 
    WHERE p.id = target_user_id
  ),
  target_contest_likes AS (
    SELECT DISTINCT
      l.id as like_id,
      l.user_id as liker_user_id,
      l.content_type,
      l.content_id,
      l.created_at
    FROM likes l
    CROSS JOIN target_user_info tui
    WHERE l.content_type = 'contest'
      AND (
        -- Match contestant-card-{target_user_name} format
        (l.content_id LIKE 'contestant-card-%' AND 
         (l.content_id = CONCAT('contestant-card-', TRIM(CONCAT(COALESCE(tui.first_name, ''), ' ', COALESCE(tui.last_name, '')))) OR
          l.content_id = CONCAT('contestant-card-', tui.target_name))) OR
        -- Match contestant-photo-{target_user_name}-{number} format  
        (l.content_id LIKE 'contestant-photo-%' AND 
         (l.content_id LIKE CONCAT('contestant-photo-', TRIM(CONCAT(COALESCE(tui.first_name, ''), ' ', COALESCE(tui.last_name, ''))), '-%') OR
          l.content_id LIKE CONCAT('contestant-photo-', tui.target_name, '-%')))
      )
      AND l.user_id != target_user_id -- Exclude self-likes
  )
  SELECT 
    tcl.like_id,
    tcl.liker_user_id,
    COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as display_name,
    p.avatar_url,
    p.photo_1_url,
    p.photo_2_url,
    p.country,
    p.city,
    p.state,
    p.age,
    p.weight_kg,
    p.height_cm,
    p.participant_type,
    tcl.content_type,
    tcl.content_id,
    tcl.created_at
  FROM target_contest_likes tcl
  JOIN profiles p ON tcl.liker_user_id = p.id
  WHERE p.is_approved = true
  ORDER BY tcl.created_at DESC;
$function$;