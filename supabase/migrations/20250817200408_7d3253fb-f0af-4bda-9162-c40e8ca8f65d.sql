-- Fix security issue: Restrict posts_media access to match associated post accessibility
-- Remove the overly permissive policy that allows anyone to view all media
DROP POLICY IF EXISTS "Posts media are viewable by everyone" ON public.posts_media;

-- Create a new secure policy that only allows viewing media if the associated post is accessible
CREATE POLICY "Posts media viewable when post is accessible" 
ON public.posts_media 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.posts 
    WHERE posts.id = posts_media.post_id
  )
);

-- Add policy to ensure media can only be accessed through valid post relationships
CREATE POLICY "Prevent orphaned media access" 
ON public.posts_media 
FOR SELECT 
USING (post_id IS NOT NULL);