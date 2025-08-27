-- Fix remaining user-facing SECURITY DEFINER functions that should respect RLS policies
-- This addresses the "Security Definer View" linter error by ensuring user-facing functions
-- use SECURITY INVOKER to properly respect Row Level Security

-- 1. Profile access functions - these should respect RLS policies
CREATE OR REPLACE FUNCTION public.get_public_profile_summary(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true
    AND p.privacy_level = 'public';
$$;

CREATE OR REPLACE FUNCTION public.get_friend_profile_summary(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, country text, city text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.country,
    p.city
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true
    AND (
      p.privacy_level = 'public' OR 
      (p.privacy_level = 'friends' AND EXISTS(
        SELECT 1 FROM public.follows 
        WHERE follower_id = auth.uid() AND followee_id = profile_user_id
      ))
    );
$$;

CREATE OR REPLACE FUNCTION public.get_detailed_profile(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, country text, city text, age integer, bio text, is_contest_participant boolean)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    CASE 
      WHEN auth.uid() = p.id OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'moderator')) OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.country
      ELSE NULL
    END as country,
    CASE 
      WHEN auth.uid() = p.id OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'moderator')) OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.city
      ELSE NULL
    END as city,
    CASE 
      WHEN auth.uid() = p.id OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'moderator')) OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.age
      ELSE NULL
    END as age,
    CASE 
      WHEN auth.uid() = p.id OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR 
           (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'moderator')) OR
           p.privacy_level = 'public' OR
           (p.privacy_level = 'friends' AND EXISTS(
             SELECT 1 FROM public.follows 
             WHERE follower_id = auth.uid() AND followee_id = profile_user_id
           ))
      THEN p.bio
      ELSE NULL
    END as bio,
    p.is_contest_participant
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true;
$$;

-- 2. Contest participant functions
CREATE OR REPLACE FUNCTION public.get_contest_participant_info()
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.is_contest_participant = true 
    AND p.is_approved = true
    AND p.privacy_level IN ('public', 'friends');
$$;

CREATE OR REPLACE FUNCTION public.get_contest_participant_info(participant_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = participant_id
    AND p.is_contest_participant = true 
    AND p.is_approved = true
    AND p.privacy_level IN ('public', 'friends');
$$;

-- 3. User interaction functions that should respect RLS
CREATE OR REPLACE FUNCTION public.get_users_i_liked(target_user_id uuid)
RETURNS TABLE(like_id uuid, liked_user_id uuid, display_name text, avatar_url text, photo_1_url text, photo_2_url text, country text, city text, age integer, participant_type text, content_type text, content_id text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_likes AS (
    SELECT 
      l.id as like_id,
      l.content_id,
      l.content_type,
      l.created_at,
      TRIM(REGEXP_REPLACE(substring(l.content_id from 'contestant-card-(.+)'), '\s+', ' ', 'g')) as extracted_name
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
  WHERE p.id IS NOT NULL 
    AND p.id != target_user_id  -- Exclude self-likes
  ORDER BY p.id, ul.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_users_who_liked_me(target_user_id uuid)
RETURNS TABLE(like_id uuid, liker_user_id uuid, display_name text, avatar_url text, photo_1_url text, photo_2_url text, country text, city text, state text, age integer, weight_kg numeric, height_cm integer, participant_type text, content_type text, content_id text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Get users who liked the target user's contest content
  WITH target_user_info AS (
    SELECT 
      COALESCE(p.display_name, CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) as target_name,
      COALESCE(p.first_name, '') as first_name,
      COALESCE(p.last_name, '') as last_name
    FROM profiles p 
    WHERE p.id = target_user_id
  )
  SELECT DISTINCT
    l.id as like_id,
    l.user_id as liker_user_id,
    COALESCE(p.display_name, CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) as display_name,
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
    l.content_type,
    l.content_id,
    l.created_at
  FROM likes l
  CROSS JOIN target_user_info tui
  JOIN profiles p ON l.user_id = p.id
  WHERE l.content_type = 'contest'
    AND l.user_id != target_user_id -- Exclude self-likes
    AND COALESCE(p.is_approved, true) = true -- Handle null is_approved as approved
    AND (
      -- Match contestant-card-{target_user_name} format (exact match)
      (l.content_id LIKE 'contestant-card-%' AND 
       (l.content_id = CONCAT('contestant-card-', tui.target_name) OR
        l.content_id = CONCAT('contestant-card-', CONCAT(tui.first_name, ' ', tui.last_name)))) OR
      -- Match contestant-photo-{target_user_name}-{number} format  
      (l.content_id LIKE 'contestant-photo-%' AND 
       (l.content_id LIKE CONCAT('contestant-photo-', tui.target_name, '-%') OR
        l.content_id LIKE CONCAT('contestant-photo-', CONCAT(tui.first_name, ' ', tui.last_name), '-%')))
    )
  ORDER BY l.created_at DESC;
$$;

-- 4. Debug function (should also respect RLS in non-production)
CREATE OR REPLACE FUNCTION public.get_users_i_liked_debug(target_user_id uuid)
RETURNS TABLE(like_id uuid, content_id text, extracted_name text, participant_name text, user_id uuid, display_name text)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Add security documentation
COMMENT ON FUNCTION public.get_public_profile_summary(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns public profile information only.';

COMMENT ON FUNCTION public.get_detailed_profile(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns detailed profile with privacy controls.';

COMMENT ON FUNCTION public.get_users_i_liked(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns users that the specified user has liked.';

COMMENT ON FUNCTION public.get_users_who_liked_me(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns users who liked the specified user.';