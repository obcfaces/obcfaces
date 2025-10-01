-- Drop and recreate the function to return more contestant data
DROP FUNCTION IF EXISTS public.get_public_contest_participant_photos(uuid[]);

CREATE OR REPLACE FUNCTION public.get_public_contest_participant_photos(participant_user_ids uuid[])
RETURNS TABLE(
  id uuid, 
  photo_1_url text, 
  photo_2_url text, 
  avatar_url text,
  age integer,
  city text,
  country text,
  height_cm integer,
  weight_kg numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Return photo URLs and safe personal data for active contest participants
  SELECT 
    p.id,
    p.photo_1_url,
    p.photo_2_url,
    p.avatar_url,
    p.age,
    p.city,
    p.country,
    p.height_cm,
    p.weight_kg
  FROM profiles p
  WHERE p.id = ANY(participant_user_ids)
    AND p.is_contest_participant = true
    AND p.is_approved = true
    AND EXISTS (
      SELECT 1 FROM weekly_contest_participants wcp
      WHERE wcp.user_id = p.id
        AND wcp.is_active = true
    );
$$;