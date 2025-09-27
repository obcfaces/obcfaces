-- Fix security issue: Remove public access to photo_comments
-- This prevents unauthenticated users from viewing user IDs and comments

-- Drop the policy that allows public access to contest comments
DROP POLICY IF EXISTS "Public can view contest comments" ON public.photo_comments;

-- The existing policy "Users can view comments on accessible content" already provides
-- proper authenticated access with the condition: auth.uid() IS NOT NULL
-- This ensures only authenticated users can view comments while maintaining functionality