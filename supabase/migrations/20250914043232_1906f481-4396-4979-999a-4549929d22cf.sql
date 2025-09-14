-- Temporary fix: Add a more permissive policy for debugging profile access
-- This will help us understand why the profile is not loading

-- Add a temporary debugging policy
CREATE POLICY "Temporary debugging - authenticated users can view public profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND (
    -- Own profile
    auth.uid() = id 
    -- Or public approved contest participants
    OR (privacy_level = 'public' AND is_approved = true)
  )
);