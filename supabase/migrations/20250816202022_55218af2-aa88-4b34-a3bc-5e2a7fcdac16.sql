-- Fix search_path for posts-related functions
DROP FUNCTION IF EXISTS public.update_posts_updated_at();
DROP FUNCTION IF EXISTS public.update_posts_likes_count();

-- Create function to update posts updated_at timestamp with proper search_path
CREATE OR REPLACE FUNCTION public.update_posts_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create function to update likes count when post_likes changes with proper search_path
CREATE OR REPLACE FUNCTION public.update_posts_likes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;