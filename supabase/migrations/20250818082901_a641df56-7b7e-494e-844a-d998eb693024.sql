-- Fix critical security issue: Posts table is publicly readable
-- Replace overly permissive policy with proper privacy controls

-- Drop the current policy that makes all posts public
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

-- Create secure policies for post viewing
-- 1. Users can always view their own posts
CREATE POLICY "Users can view their own posts" 
ON public.posts 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Admins and moderators can view all posts
CREATE POLICY "Admins and moderators can view all posts" 
ON public.posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 3. Public posts from approved profiles are viewable by everyone
CREATE POLICY "Public posts are viewable by everyone" 
ON public.posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = posts.user_id 
    AND profiles.is_approved = true 
    AND profiles.privacy_level = 'public'
  )
);

-- 4. Friends-only posts are viewable by followers
CREATE POLICY "Friends posts are viewable by followers" 
ON public.posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = posts.user_id 
    AND profiles.is_approved = true 
    AND profiles.privacy_level = 'friends'
  )
  AND EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follows.follower_id = auth.uid() 
    AND follows.followee_id = posts.user_id
  )
);