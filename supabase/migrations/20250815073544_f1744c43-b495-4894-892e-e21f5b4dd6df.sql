-- Drop the overly permissive policy
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create more secure and granular policies for profile visibility

-- Users can always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow viewing of profiles that are explicitly marked as public/approved
-- This is useful for contestant profiles or users who want public visibility
CREATE POLICY "Public can view approved profiles" 
ON public.profiles 
FOR SELECT 
USING (is_approved = true);

-- Admins and moderators can view all profiles for moderation purposes
CREATE POLICY "Admins and moderators can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Add a privacy_level column to allow users to control their profile visibility
ALTER TABLE public.profiles 
ADD COLUMN privacy_level text DEFAULT 'private' 
CHECK (privacy_level IN ('private', 'friends', 'public'));

-- Create policy for friend-level visibility (for future social features)
CREATE POLICY "Users can view friends profiles" 
ON public.profiles 
FOR SELECT 
USING (
  privacy_level = 'public' OR 
  (privacy_level = 'friends' AND EXISTS (
    SELECT 1 FROM public.follows 
    WHERE (follower_id = auth.uid() AND followee_id = profiles.id) OR
          (follower_id = profiles.id AND followee_id = auth.uid())
  ))
);