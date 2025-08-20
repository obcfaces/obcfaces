-- Create comments table for storing comments on photos
CREATE TABLE IF NOT EXISTS public.photo_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content_type text NOT NULL DEFAULT 'contest',
  content_id text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own comments" 
ON public.photo_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all comments" 
ON public.photo_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own comments" 
ON public.photo_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.photo_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_photo_comments_content ON public.photo_comments(content_type, content_id);
CREATE INDEX idx_photo_comments_user ON public.photo_comments(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_photo_comments_updated_at
BEFORE UPDATE ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();