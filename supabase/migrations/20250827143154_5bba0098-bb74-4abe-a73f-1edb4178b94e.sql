-- Fix remaining SECURITY DEFINER functions that should use SECURITY INVOKER
-- to properly respect RLS policies for better security

-- Functions that can safely use SECURITY INVOKER (user-facing functions that work with accessible data)

-- 1. Rating and statistics functions that work with user's own data
CREATE OR REPLACE FUNCTION public.get_rating_stats(contestant_name_param text, contestant_user_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint, rating_distribution json)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes,
    json_object_agg(rating, count) as rating_distribution
  FROM (
    SELECT 
      rating,
      COUNT(*) as count
    FROM contestant_ratings 
    WHERE contestant_name = contestant_name_param 
      AND (contestant_user_id_param IS NULL OR contestant_user_id = contestant_user_id_param)
    GROUP BY rating
  ) rating_counts;
$$;

CREATE OR REPLACE FUNCTION public.get_contestant_average_rating(contestant_name_param text, contestant_user_id_param uuid DEFAULT NULL::uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1)
  FROM public.contestant_ratings 
  WHERE contestant_name = contestant_name_param 
    AND (contestant_user_id_param IS NULL OR contestant_user_id = contestant_user_id_param);
$$;

-- 2. User statistics functions that respect RLS
CREATE OR REPLACE FUNCTION public.get_user_rating_stats(target_user_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint, user_has_voted boolean)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes,
    EXISTS(
      SELECT 1 FROM contestant_ratings 
      WHERE contestant_user_id = target_user_id 
        AND user_id = auth.uid()
    ) as user_has_voted
  FROM contestant_ratings 
  WHERE contestant_user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_likes_count(target_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM likes 
  WHERE (
    content_id = CONCAT('contestant-user-', target_user_id) OR
    content_id LIKE CONCAT('contestant-user-', target_user_id, '-%')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_comments_count(target_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM photo_comments 
  WHERE (
    content_id = CONCAT('contestant-user-', target_user_id) OR
    content_id LIKE CONCAT('contestant-user-', target_user_id, '-%')
  );
$$;

-- 3. Participant statistics functions
CREATE OR REPLACE FUNCTION public.get_participant_rating_stats(participant_id_param uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint, user_has_voted boolean)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*) as total_votes,
    EXISTS(
      SELECT 1 FROM contestant_ratings 
      WHERE participant_id = participant_id_param 
        AND user_id = auth.uid()
    ) as user_has_voted
  FROM contestant_ratings 
  WHERE participant_id = participant_id_param;
$$;

CREATE OR REPLACE FUNCTION public.get_participant_likes_count(participant_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM likes 
  WHERE participant_id = participant_id_param;
$$;

CREATE OR REPLACE FUNCTION public.get_participant_comments_count(participant_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)
  FROM photo_comments 
  WHERE participant_id = participant_id_param;
$$;

-- 4. Follow statistics function
CREATE OR REPLACE FUNCTION public.get_follow_stats(target_user_id uuid)
RETURNS TABLE(followers_count integer, following_count integer)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select
    (select count(*) from public.follows where followee_id = target_user_id) as followers_count,
    (select count(*) from public.follows where follower_id = target_user_id) as following_count
$$;

-- 5. Utility function for week calculation (no security implications)
CREATE OR REPLACE FUNCTION public.get_week_monday(input_date date DEFAULT CURRENT_DATE)
RETURNS date
LANGUAGE sql
IMMUTABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM input_date) = 0 THEN input_date - INTERVAL '6 days'
      ELSE input_date - INTERVAL '1 day' * (EXTRACT(DOW FROM input_date) - 1)
    END::DATE;
$$;

-- Note: Keep SECURITY DEFINER for critical functions that MUST bypass RLS:
-- - has_role (required for RLS policy evaluation)
-- - get_or_create_conversation (needs cross-user access)
-- - Admin functions (get_contest_applications_admin, etc.)
-- - Trigger functions (save_application_history, etc.)
-- - Auth-related functions (handle_new_user, etc.)

-- Add comments explaining security choices
COMMENT ON FUNCTION public.get_rating_stats(text, uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Calculates public rating statistics.';

COMMENT ON FUNCTION public.get_user_rating_stats(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns user rating stats with proper access control.';

COMMENT ON FUNCTION public.get_follow_stats(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns public follow statistics.';