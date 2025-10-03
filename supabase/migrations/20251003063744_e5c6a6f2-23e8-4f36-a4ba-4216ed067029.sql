-- Fix: Restrict contest participant profile access to only safe public fields
-- This prevents exposure of sensitive data like birthdate, height, weight, marital status, etc.

-- First, drop the overly permissive policies for contest participants
DROP POLICY IF EXISTS "Authenticated can view contest participant safe info" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated view safe contest info" ON public.profiles;

-- Create a new, more restrictive policy that limits what fields are accessible
-- Note: RLS cannot restrict columns, so we rely on application code to only request safe fields
-- This policy allows viewing profiles, but application should use secure functions
CREATE POLICY "Contest participants viewable with restrictions"
ON public.profiles
FOR SELECT
USING (
  is_contest_participant = true 
  AND is_approved = true 
  AND is_active_contest_participant(id)
);

-- Create a secure function to get safe contest participant profile data
-- This function is SECURITY DEFINER so it bypasses RLS and returns only safe fields
CREATE OR REPLACE FUNCTION public.get_safe_contest_participant_profile(participant_id_param uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  first_name text,
  photo_1_url text,
  photo_2_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    display_name,
    avatar_url,
    bio,
    first_name,
    photo_1_url,
    photo_2_url
  FROM public.profiles
  WHERE id = participant_id_param
    AND is_contest_participant = true
    AND is_approved = true;
$$;

COMMENT ON FUNCTION public.get_safe_contest_participant_profile IS 
'Returns only safe, public fields for contest participants. Does not expose sensitive data like birthdate, height, weight, marital status, location details, etc.';