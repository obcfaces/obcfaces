-- Create function to get users who voted (like/dislike) for a participant
CREATE OR REPLACE FUNCTION get_next_week_voters(participant_name_param text, vote_type_param text DEFAULT 'all')
RETURNS TABLE(
  user_id uuid,
  vote_type text,
  vote_count integer,
  created_at timestamp with time zone,
  display_name text,
  avatar_url text,
  first_name text,
  last_name text,
  age integer,
  city text,
  country text,
  photo_1_url text,
  photo_2_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    nwv.user_id,
    nwv.vote_type,
    nwv.vote_count,
    nwv.created_at,
    COALESCE(p.display_name, CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) as display_name,
    p.avatar_url,
    p.first_name,
    p.last_name,
    p.age,
    p.city,
    p.country,
    p.photo_1_url,
    p.photo_2_url
  FROM next_week_votes nwv
  LEFT JOIN profiles p ON p.id = nwv.user_id
  WHERE nwv.candidate_name = participant_name_param
    AND (vote_type_param = 'all' OR nwv.vote_type = vote_type_param)
  ORDER BY nwv.created_at DESC;
END;
$function$;