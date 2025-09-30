-- Security Fix: Restrict public access to likes table
-- Issue: User voting patterns and IDs are publicly accessible
-- Solution: Remove public read policy and create secure aggregate function

-- 1. Drop the insecure public read policy
DROP POLICY IF EXISTS "Public can view contest likes" ON public.likes;

-- 2. Keep policies that allow users to manage only their own likes
-- (These already exist and are secure)

-- 3. Create a secure function to get aggregate like data without exposing user IDs
CREATE OR REPLACE FUNCTION public.get_content_like_stats(
  content_type_param text,
  content_id_param text,
  requesting_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  total_likes bigint,
  user_has_liked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::bigint as total_likes,
    COALESCE(
      CASE 
        WHEN requesting_user_id IS NULL THEN false
        ELSE EXISTS(
          SELECT 1 FROM likes 
          WHERE content_type = content_type_param 
            AND content_id = content_id_param
            AND user_id = requesting_user_id
        )
      END,
      false
    ) as user_has_liked
  FROM likes 
  WHERE content_type = content_type_param 
    AND content_id = content_id_param;
$$;

-- 4. Create function to get stats for multiple content IDs at once (more efficient)
CREATE OR REPLACE FUNCTION public.get_participant_content_stats(
  profile_id_param uuid,
  requesting_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  total_likes bigint,
  user_has_liked boolean,
  total_comments bigint,
  user_has_commented boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH like_stats AS (
    SELECT 
      COUNT(*) as like_count,
      COALESCE(
        bool_or(user_id = requesting_user_id),
        false
      ) as user_liked
    FROM likes
    WHERE content_type = 'contest'
      AND (
        content_id = CONCAT('contestant-user-', profile_id_param)
        OR content_id LIKE CONCAT('contestant-user-', profile_id_param, '-%')
      )
  ),
  comment_stats AS (
    SELECT 
      COUNT(*) as comment_count,
      COALESCE(
        bool_or(user_id = requesting_user_id),
        false
      ) as user_commented
    FROM photo_comments
    WHERE content_type = 'contest'
      AND (
        content_id = CONCAT('contestant-user-', profile_id_param)
        OR content_id LIKE CONCAT('contestant-user-', profile_id_param, '-%')
      )
  )
  SELECT 
    COALESCE(l.like_count, 0)::bigint as total_likes,
    COALESCE(l.user_liked, false) as user_has_liked,
    COALESCE(c.comment_count, 0)::bigint as total_comments,
    COALESCE(c.user_commented, false) as user_has_commented
  FROM like_stats l
  CROSS JOIN comment_stats c;
$$;

-- 5. Add comments explaining the security model
COMMENT ON FUNCTION public.get_content_like_stats IS 
'Returns aggregate like statistics without exposing individual user IDs. Only returns whether the requesting user has liked the content.';

COMMENT ON FUNCTION public.get_participant_content_stats IS 
'Returns aggregate statistics for a participant without exposing individual user IDs. Optimized for participant profile views.';
