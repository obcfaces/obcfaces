-- Create function to get participant rating stats excluding suspicious users
CREATE OR REPLACE FUNCTION public.get_clean_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(AVG(cr.rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*)::BIGINT as total_votes
  FROM contestant_ratings cr
  WHERE cr.participant_id = target_participant_id
    -- Exclude ratings from suspicious users
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = cr.user_id 
      AND ur.role = 'suspicious'
    );
$function$;

-- Also update the existing get_public_participant_rating_stats to exclude suspicious users
CREATE OR REPLACE FUNCTION public.get_public_participant_rating_stats(target_participant_id uuid)
RETURNS TABLE(average_rating numeric, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(AVG(cr.rating), 0)::NUMERIC(3,1) as average_rating,
    COUNT(*)::BIGINT as total_votes
  FROM contestant_ratings cr
  WHERE cr.participant_id = target_participant_id
    -- Exclude ratings from suspicious users
    AND NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = cr.user_id 
      AND ur.role = 'suspicious'
    );
$function$;