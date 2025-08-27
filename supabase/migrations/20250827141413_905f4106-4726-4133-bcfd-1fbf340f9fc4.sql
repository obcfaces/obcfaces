-- Fix Security Definer functions that may pose security risks
-- Issue: Some functions use SECURITY DEFINER which can bypass RLS policies

-- Review and modify functions that don't need SECURITY DEFINER
-- Keep SECURITY DEFINER only for functions that absolutely need elevated privileges

-- 1. Functions that should keep SECURITY DEFINER (administrative/system functions):
--    - has_role (needed to check user roles for RLS policies)
--    - get_or_create_conversation (needs to bypass RLS for conversation creation)
--    - cleanup_duplicate_conversations_safe (admin function)
--    - create_weekly_contest (admin function)
--    - archive_old_data (admin cleanup function)
--    - Various admin getter functions that need to bypass RLS

-- 2. Functions that can be changed to SECURITY INVOKER (user-level functions):
--    These functions work with data the user already has access to

-- Update user-facing functions to use SECURITY INVOKER instead of SECURITY DEFINER
-- These functions should respect the user's RLS policies

CREATE OR REPLACE FUNCTION public.check_user_voted(contestant_name_param text, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM contestant_ratings 
    WHERE contestant_name = contestant_name_param 
      AND user_id = user_id_param
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_liked_participant(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM likes 
    WHERE user_id = auth.uid()
      AND (
        content_id = CONCAT('contestant-user-', target_user_id) OR
        content_id LIKE CONCAT('contestant-user-', target_user_id, '-%')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_liked_participant_id(participant_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM likes 
    WHERE user_id = auth.uid()
      AND participant_id = participant_id_param
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_rating_for_user(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT rating 
  FROM contestant_ratings 
  WHERE contestant_user_id = target_user_id 
    AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_rating_for_participant(participant_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT rating 
  FROM contestant_ratings 
  WHERE participant_id = participant_id_param 
    AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_following(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT coalesce(
    EXISTS(
      SELECT 1 FROM public.follows
      WHERE follower_id = auth.uid() AND followee_id = target_user_id
    ), false);
$$;

-- Note: Some functions like has_role, get_or_create_conversation, and admin functions
-- MUST keep SECURITY DEFINER to function properly. These are necessary for:
-- 1. RLS policy evaluation (has_role)
-- 2. Cross-user operations (conversation management)
-- 3. Administrative operations (contest management, cleanup)

-- Add comment explaining the security model
COMMENT ON FUNCTION public.check_user_voted(text, uuid) IS 
'Uses SECURITY INVOKER to respect user RLS policies. Only checks data the user already has access to.';

COMMENT ON FUNCTION public.check_user_liked_participant(uuid) IS 
'Uses SECURITY INVOKER to respect user RLS policies. Only checks user own likes.';

COMMENT ON FUNCTION public.check_user_liked_participant_id(uuid) IS 
'Uses SECURITY INVOKER to respect user RLS policies. Only checks user own likes.';

-- Add documentation comment about SECURITY DEFINER usage
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'CRITICAL: Uses SECURITY DEFINER as required for RLS policy evaluation. This function must bypass RLS to check user roles used in RLS policies.';