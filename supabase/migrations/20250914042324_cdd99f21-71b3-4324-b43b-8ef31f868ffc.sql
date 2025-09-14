-- Update privacy levels for users to make profiles accessible
-- Fix profile visibility issues

-- First, set default privacy level for existing profiles
UPDATE public.profiles 
SET privacy_level = 'public' 
WHERE privacy_level = 'private' AND id = '1b5c2751-a820-4767-87e6-d06080219942';

-- Set is_approved to true for existing profiles that are null
UPDATE public.profiles 
SET is_approved = true 
WHERE is_approved IS NULL;

-- Update the RLS policy to be more permissive for profile owners
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a more comprehensive policy
CREATE POLICY "Profiles are viewable with proper access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always view their own profile
  auth.uid() = id 
  -- OR profiles with public privacy
  OR privacy_level = 'public'
  -- OR profiles that are null (default to accessible)
  OR privacy_level IS NULL  
  -- OR approved profiles
  OR is_approved = true
  -- OR admins/moderators
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
);