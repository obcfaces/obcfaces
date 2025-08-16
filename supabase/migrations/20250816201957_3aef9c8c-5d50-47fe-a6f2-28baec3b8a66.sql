-- Create posts table for user posts
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,
  media_urls TEXT[] NOT NULL,
  media_types TEXT[] NOT NULL, -- 'image' or 'video'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts_media table for individual media files
CREATE TABLE public.posts_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size INTEGER,
  mime_type TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table for tracking likes
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" 
ON public.posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Posts media policies
CREATE POLICY "Posts media are viewable by everyone" 
ON public.posts_media 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create media for their own posts" 
ON public.posts_media 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = posts_media.post_id 
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update media for their own posts" 
ON public.posts_media 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = posts_media.post_id 
    AND posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete media for their own posts" 
ON public.posts_media 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = posts_media.post_id 
    AND posts.user_id = auth.uid()
  )
);

-- Post likes policies
CREATE POLICY "Post likes are viewable by everyone" 
ON public.post_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.post_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for posts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for posts bucket
CREATE POLICY "Posts images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Users can upload to their own posts folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own posts files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update posts updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_updated_at();

-- Create function to update likes count when post_likes changes
CREATE OR REPLACE FUNCTION public.update_posts_likes_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers for automatic likes count updates
CREATE TRIGGER update_posts_likes_count_insert
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_likes_count();

CREATE TRIGGER update_posts_likes_count_delete
AFTER DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_posts_likes_count();

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_media_post_id ON public.posts_media(post_id);
CREATE INDEX idx_posts_media_order ON public.posts_media(post_id, order_index);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);