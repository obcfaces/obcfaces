-- Drop the existing policy that allows public access to approved profiles
DROP POLICY "Public can view approved profiles" ON public.profiles;

-- Create a more secure policy that requires authentication for viewing approved profiles
CREATE POLICY "Authenticated users can view approved profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_approved = true);

-- Create a function to get limited public profile data (without sensitive info)
-- This will be used for any public-facing features that need basic profile info
CREATE OR REPLACE FUNCTION public.get_public_profile_summary(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  country text,
  city text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.country,
    p.city
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_approved = true
    AND p.privacy_level IN ('public', 'friends');
$$;

-- Add a comment explaining the security consideration
COMMENT ON FUNCTION public.get_public_profile_summary(uuid) IS 
'Returns only non-sensitive profile data for public display. Excludes birthdate, physical measurements, and precise personal details.';

-- Update the existing "Users can view friends profiles" policy to be more explicit about authentication
DROP POLICY "Users can view friends profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view friends profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  privacy_level = 'public' OR 
  (privacy_level = 'friends' AND EXISTS (
    SELECT 1 FROM public.follows 
    WHERE (follower_id = auth.uid() AND followee_id = profiles.id) OR
          (follower_id = profiles.id AND followee_id = auth.uid())
  ))
);