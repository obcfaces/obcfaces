-- Fix parameter name conflict and complete the security fixes

-- Drop and recreate the function with correct parameter name
DROP FUNCTION IF EXISTS public.get_user_rating_for_participant(uuid);

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

-- Add documentation
COMMENT ON FUNCTION public.get_user_rating_for_participant(uuid) IS 
'Uses SECURITY INVOKER to respect RLS policies. Returns current user rating for participant.';