-- Update the get_weekly_contest_participants_next function to use 'next' status
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_next(INTEGER);

CREATE OR REPLACE FUNCTION public.get_weekly_contest_participants_next(week_offset INTEGER DEFAULT 1)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  city TEXT,
  country TEXT,
  photo_1_url TEXT,
  photo_2_url TEXT,
  height_cm INTEGER,
  weight_kg NUMERIC,
  final_rank INTEGER,
  total_votes INTEGER,
  average_rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wcp.id as participant_id,
    wcp.user_id,
    p.first_name,
    p.last_name,
    p.age,
    p.city,
    p.country,
    p.photo_1_url,
    p.photo_2_url,
    p.height_cm,
    p.weight_kg,
    wcp.final_rank,
    wcp.total_votes,
    wcp.average_rating,
    wcp.created_at
  FROM weekly_contest_participants wcp
  JOIN profiles p ON p.id = wcp.user_id
  WHERE wcp.is_active = true
    AND wcp.admin_status = 'next'
    AND p.is_approved = true
    AND EXISTS (
      SELECT 1 
      FROM contest_applications ca 
      WHERE ca.user_id = wcp.user_id 
        AND ca.status = 'approved' 
        AND ca.is_active = true 
        AND ca.deleted_at IS NULL
    )
  ORDER BY wcp.average_rating DESC NULLS LAST, wcp.total_votes DESC NULLS LAST;
END;
$$;