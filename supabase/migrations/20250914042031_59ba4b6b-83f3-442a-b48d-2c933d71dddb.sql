-- Improve RLS policies for profiles table to allow public profile viewing

-- Drop existing restrictive policies and add more permissive ones for public viewing
DROP POLICY IF EXISTS "Users can view profiles of conversation participants" ON public.profiles;

-- Add policy to allow viewing of public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (
  privacy_level = 'public' 
  OR privacy_level IS NULL  -- Handle cases where privacy_level is not set
  OR auth.uid() = id  -- Users can always view their own profile
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- Keep existing policies but ensure they don't conflict
-- Users can still view profiles in conversations
CREATE POLICY "Users can view conversation participants profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM (conversation_participants cp1
      JOIN conversation_participants cp2 ON ((cp1.conversation_id = cp2.conversation_id)))
    WHERE ((cp1.user_id = auth.uid()) AND (cp2.user_id = profiles.id) AND (cp1.user_id <> cp2.user_id))
  )
);

-- Ensure contest participants profiles are viewable
CREATE POLICY "Contest participants profiles are viewable"
ON public.profiles
FOR SELECT
USING (
  is_contest_participant = true 
  AND is_approved = true
);

-- Update privacy_level for existing profiles that don't have it set
UPDATE public.profiles 
SET privacy_level = 'public' 
WHERE privacy_level IS NULL;