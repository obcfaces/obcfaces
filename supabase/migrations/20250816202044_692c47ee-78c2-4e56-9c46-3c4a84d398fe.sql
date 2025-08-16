-- Fix search_path for posts-related functions by dropping with CASCADE first
DROP FUNCTION IF EXISTS public.update_posts_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_posts_likes_count() CASCADE;

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

-- Recreate triggers
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_updated_at();

CREATE TRIGGER update_posts_likes_count_insert
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_likes_count();

CREATE TRIGGER update_posts_likes_count_delete
AFTER DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_likes_count();