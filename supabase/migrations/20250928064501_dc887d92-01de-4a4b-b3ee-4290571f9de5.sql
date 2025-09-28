-- Add like and dislike counts to next_week_votes table
ALTER TABLE next_week_votes 
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to get next week vote statistics
CREATE OR REPLACE FUNCTION get_next_week_vote_stats()
RETURNS TABLE(
  candidate_name text,
  like_count bigint,
  dislike_count bigint,
  total_votes bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    nwv.candidate_name,
    COALESCE(SUM(CASE WHEN nwv.vote_type = 'like' THEN nwv.vote_count ELSE 0 END), 0) as like_count,
    COALESCE(SUM(CASE WHEN nwv.vote_type = 'dislike' THEN nwv.vote_count ELSE 0 END), 0) as dislike_count,
    COALESCE(SUM(nwv.vote_count), 0) as total_votes
  FROM next_week_votes nwv
  GROUP BY nwv.candidate_name
  ORDER BY total_votes DESC;
$function$;

-- Create function to get next week participants with vote stats
CREATE OR REPLACE FUNCTION get_next_week_participants_with_votes()
RETURNS TABLE(
  participant_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  display_name text,
  photo_1_url text,
  photo_2_url text,
  avatar_url text,
  age integer,
  country text,
  state text,
  city text,
  height_cm integer,
  weight_kg numeric,
  gender text,
  marital_status text,
  has_children boolean,
  average_rating numeric,
  total_votes integer,
  participant_status text,
  like_count bigint,
  dislike_count bigint,
  vote_total bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    COALESCE(wcp.application_data->>'first_name', '') as first_name,
    COALESCE(wcp.application_data->>'last_name', '') as last_name,
    COALESCE(p.display_name, CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', ''))) as display_name,
    COALESCE(
      wcp.application_data->>'photo1_url', 
      wcp.application_data->>'photo_1_url',
      ''
    ) as photo_1_url,
    COALESCE(
      wcp.application_data->>'photo2_url', 
      wcp.application_data->>'photo_2_url',
      ''
    ) as photo_2_url,
    COALESCE(p.avatar_url, '') as avatar_url,
    COALESCE(
      CASE 
        WHEN wcp.application_data->>'birth_year' IS NOT NULL THEN 
          EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - (wcp.application_data->>'birth_year')::INTEGER
        WHEN wcp.application_data->>'age' IS NOT NULL THEN
          (wcp.application_data->>'age')::INTEGER
        ELSE NULL
      END, 0
    ) as age,
    COALESCE(wcp.application_data->>'country', '') as country,
    COALESCE(wcp.application_data->>'state', '') as state,
    COALESCE(wcp.application_data->>'city', '') as city,
    COALESCE((wcp.application_data->>'height_cm')::INTEGER, 0) as height_cm,
    COALESCE((wcp.application_data->>'weight_kg')::NUMERIC, 0) as weight_kg,
    COALESCE(wcp.application_data->>'gender', '') as gender,
    COALESCE(wcp.application_data->>'marital_status', '') as marital_status,
    COALESCE((wcp.application_data->>'has_children')::BOOLEAN, false) as has_children,
    COALESCE(wcp.average_rating, 0::NUMERIC) as average_rating,
    COALESCE(wcp.total_votes, 0) as total_votes,
    COALESCE(wcp.admin_status, 'next week') as participant_status,
    COALESCE(vs.like_count, 0) as like_count,
    COALESCE(vs.dislike_count, 0) as dislike_count,
    COALESCE(vs.total_votes, 0) as vote_total
  FROM weekly_contest_participants wcp
  LEFT JOIN profiles p ON p.id = wcp.user_id AND p.privacy_level = 'public'
  LEFT JOIN LATERAL (
    SELECT 
      COALESCE(SUM(CASE WHEN nwv.vote_type = 'like' THEN nwv.vote_count ELSE 0 END), 0) as like_count,
      COALESCE(SUM(CASE WHEN nwv.vote_type = 'dislike' THEN nwv.vote_count ELSE 0 END), 0) as dislike_count,
      COALESCE(SUM(nwv.vote_count), 0) as total_votes
    FROM next_week_votes nwv
    WHERE nwv.candidate_name = COALESCE(p.display_name, CONCAT(COALESCE(wcp.application_data->>'first_name', ''), ' ', COALESCE(wcp.application_data->>'last_name', '')))
  ) vs ON true
  WHERE wcp.is_active = true
    AND wcp.admin_status IN ('next week', 'next week on site')
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    )
  ORDER BY vs.total_votes DESC NULLS LAST, wcp.average_rating DESC NULLS LAST;
END;
$function$;