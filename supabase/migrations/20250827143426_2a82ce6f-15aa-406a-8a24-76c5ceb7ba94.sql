-- Final fix for remaining SECURITY DEFINER functions
-- Address the remaining functions that should use SECURITY INVOKER for proper RLS compliance

-- 1. Public contest functions that should respect RLS
CREATE OR REPLACE FUNCTION public.get_contest_participants()
RETURNS TABLE(id uuid, user_id uuid, first_name text, last_name text, age integer, city text, country text, photo1_url text, photo2_url text, height_cm integer, weight_kg numeric)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ca.id,
    ca.user_id,
    (ca.application_data->>'first_name')::text as first_name,
    (ca.application_data->>'last_name')::text as last_name,
    (date_part('year', now()) - (ca.application_data->>'birth_year')::integer)::integer as age,
    (ca.application_data->>'city')::text as city,
    CASE 
      WHEN ca.application_data->>'country' = 'PH' THEN 'Philippines'
      ELSE (ca.application_data->>'country')::text
    END as country,
    (ca.application_data->>'photo1_url')::text as photo1_url,
    (ca.application_data->>'photo2_url')::text as photo2_url,
    (ca.application_data->>'height_cm')::integer as height_cm,
    (ca.application_data->>'weight_kg')::numeric as weight_kg
  FROM public.contest_applications ca
  WHERE ca.status = 'approved'
  ORDER BY ca.created_at DESC
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.get_contest_leaderboard(contest_week_offset integer DEFAULT 0)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, avg_rating numeric, total_votes bigint, rank_position bigint)
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ps.user_id,
    CONCAT(ps.first_name, ' ', ps.last_name) as full_name,
    p.avatar_url,
    ps.avg_rating,
    ps.total_ratings,
    ROW_NUMBER() OVER (ORDER BY ps.avg_rating DESC, ps.total_ratings DESC) as rank_position
  FROM participant_stats ps
  LEFT JOIN profiles p ON p.id = ps.user_id
  JOIN weekly_contests wc ON wc.id = ps.contest_id
  WHERE wc.week_start_date = (
    SELECT week_start_date 
    FROM weekly_contests 
    ORDER BY week_start_date DESC 
    OFFSET ABS(contest_week_offset) 
    LIMIT 1
  )
  ORDER BY ps.avg_rating DESC, ps.total_ratings DESC;
$$;

-- 2. User rating function - can respect RLS
CREATE OR REPLACE FUNCTION public.get_user_rating_for_participant(participant_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT rating 
  FROM contestant_ratings 
  WHERE participant_id = participant_id_param 
    AND user_id = auth.uid()
  LIMIT 1;
$$;

-- 3. Keep conversation check functions as SECURITY DEFINER but update them for better security
-- These MUST remain SECURITY DEFINER as they're used in RLS policies and need to bypass RLS
-- to check conversation membership

-- Note: user_in_conversation and user_is_in_conversation MUST remain SECURITY DEFINER
-- because they are used in RLS policies and need to bypass RLS to check conversation membership.
-- However, we can improve them by ensuring they have proper search_path.

CREATE OR REPLACE FUNCTION public.user_in_conversation(conversation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  -- MUST remain SECURITY DEFINER for RLS policy usage
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_participants.conversation_id = $1 
    AND conversation_participants.user_id = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_in_conversation(conversation_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  -- MUST remain SECURITY DEFINER for RLS policy usage
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = conversation_id_param 
    AND user_id = user_id_param
  );
$$;

-- Add documentation for security decisions
COMMENT ON FUNCTION public.get_contest_participants() IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns approved contest participants.';

COMMENT ON FUNCTION public.get_contest_leaderboard(integer) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns contest leaderboard with public data.';

COMMENT ON FUNCTION public.get_user_rating_for_participant(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns current user rating for participant.';

COMMENT ON FUNCTION public.user_in_conversation(uuid, uuid) IS 
'CRITICAL: Uses SECURITY DEFINER as required for RLS policy evaluation. Must bypass RLS to check conversation membership.';

COMMENT ON FUNCTION public.user_is_in_conversation(uuid, uuid) IS 
'CRITICAL: Uses SECURITY DEFINER as required for RLS policy evaluation. Must bypass RLS to check conversation membership.';