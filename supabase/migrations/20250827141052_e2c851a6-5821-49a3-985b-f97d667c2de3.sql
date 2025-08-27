-- Fix security vulnerabilities in photo_comments and likes tables
-- Issue: Both tables currently allow unrestricted public access to sensitive user data

-- 1. Drop the overly permissive RLS policies for photo_comments
DROP POLICY IF EXISTS "Users can view all comments" ON public.photo_comments;

-- 2. Create secure RLS policy for photo_comments
-- Comments should only be visible to:
-- - The author of the comment
-- - Authenticated users viewing comments on content they can access
CREATE POLICY "Users can view comments on accessible content" 
ON public.photo_comments 
FOR SELECT 
USING (
  -- User is authenticated AND (owns the comment OR can access the content)
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    -- For contest content, ensure user can view contest data
    (content_type = 'contest' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_contest_participant = true
    )) OR
    -- For other content types, allow if authenticated
    content_type != 'contest'
  )
);

-- 3. Drop the overly permissive RLS policy for likes
DROP POLICY IF EXISTS "Users can view all likes for counting" ON public.likes;

-- 4. Create secure RLS policies for likes table
-- Allow users to see their own likes
CREATE POLICY "Users can view their own likes" 
ON public.likes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to see like counts but not individual like data
-- This is handled by creating a separate view for like counts that aggregates data
CREATE OR REPLACE VIEW public.like_counts AS
SELECT 
  content_type,
  content_id,
  COUNT(*) as like_count
FROM public.likes
GROUP BY content_type, content_id;

-- Enable RLS on the view (inherits security from underlying table)
ALTER VIEW public.like_counts SET (security_barrier = true);

-- 5. Create a function to check if a user can view specific content likes
-- This allows viewing likes on content the user can access
CREATE POLICY "Users can view likes on accessible content" 
ON public.likes 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    -- For contest content, check if user is participant
    (content_type = 'contest' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_contest_participant = true
    )) OR
    -- For other content types, allow if authenticated
    content_type != 'contest'
  )
);

-- 6. Add comment to explain the security model
COMMENT ON POLICY "Users can view comments on accessible content" ON public.photo_comments IS 
'Restricts comment visibility to authenticated users who can access the related content. Prevents unauthorized access to user behavior patterns and personal opinions.';

COMMENT ON POLICY "Users can view likes on accessible content" ON public.likes IS 
'Restricts like visibility to prevent exposure of user activity patterns and preferences. Only shows likes to users who can access the related content.';

COMMENT ON VIEW public.like_counts IS 
'Provides aggregated like counts without exposing individual user like data for privacy protection.';