-- Fix get_user_rating_for_participant to handle both participant_id and contestant_user_id
CREATE OR REPLACE FUNCTION public.get_user_rating_for_participant(participant_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT rating 
  FROM contestant_ratings 
  WHERE (
    participant_id = participant_id_param OR 
    contestant_user_id = participant_id_param
  )
    AND user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
$function$;