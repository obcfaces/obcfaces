-- Update the rating stats function to properly handle participant_id to user_id mapping
CREATE OR REPLACE FUNCTION public.get_public_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  -- Get the user_id for this participant first, then get ratings
  WITH participant_user AS (
    SELECT user_id 
    FROM weekly_contest_participants 
    WHERE id = target_participant_id
  )
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*)::BIGINT as total_votes
  FROM contestant_ratings cr
  CROSS JOIN participant_user pu
  WHERE cr.contestant_user_id = pu.user_id;
$function$;