-- Create function to get all profiles without PostgREST limits
CREATE OR REPLACE FUNCTION public.get_all_profiles_admin()
RETURNS TABLE (
  id uuid,
  display_name text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  age integer,
  height_cm integer,
  weight_kg numeric,
  birthdate date,
  city text,
  country text,
  gender text,
  bio text,
  state text,
  marital_status text,
  has_children boolean,
  is_contest_participant boolean,
  is_approved boolean,
  moderated_at timestamp with time zone,
  moderated_by uuid,
  moderation_notes text,
  privacy_level text,
  participant_type text,
  photo_1_url text,
  photo_2_url text,
  locale text,
  provider_data jsonb,
  email_verified boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin or moderator
  IF NOT (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'moderator')
    )
  ) THEN
    RAISE EXCEPTION 'Only admins and moderators can access this function';
  END IF;

  -- Return ALL profiles without any limit
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.age,
    p.height_cm,
    p.weight_kg,
    p.birthdate,
    p.city,
    p.country,
    p.gender,
    p.bio,
    p.state,
    p.marital_status,
    p.has_children,
    p.is_contest_participant,
    p.is_approved,
    p.moderated_at,
    p.moderated_by,
    p.moderation_notes,
    p.privacy_level,
    p.participant_type,
    p.photo_1_url,
    p.photo_2_url,
    p.locale,
    p.provider_data,
    p.email_verified
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;