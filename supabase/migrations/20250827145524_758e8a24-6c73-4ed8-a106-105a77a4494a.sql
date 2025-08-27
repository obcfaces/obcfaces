-- Fix Security Definer View issue by replacing like_counts view with proper table
-- First drop the existing view
DROP VIEW IF EXISTS public.like_counts;

-- Create like_counts as a proper table instead of a view
CREATE TABLE public.like_counts (
  content_type text NOT NULL,
  content_id text NOT NULL,
  like_count bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (content_type, content_id)
);

-- Enable RLS on the new table
ALTER TABLE public.like_counts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for like_counts table
CREATE POLICY "Anyone can view like counts" 
ON public.like_counts 
FOR SELECT 
USING (true);

-- Only system can update like counts (via triggers)
CREATE POLICY "System can manage like counts" 
ON public.like_counts 
FOR ALL 
USING (false);

-- Create function to update like counts
CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.like_counts (content_type, content_id, like_count, updated_at)
    VALUES (NEW.content_type, NEW.content_id, 1, now())
    ON CONFLICT (content_type, content_id) 
    DO UPDATE SET 
      like_count = like_counts.like_count + 1,
      updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.like_counts 
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = now()
    WHERE content_type = OLD.content_type 
      AND content_id = OLD.content_id;
    
    -- Remove row if count reaches 0
    DELETE FROM public.like_counts 
    WHERE content_type = OLD.content_type 
      AND content_id = OLD.content_id 
      AND like_count = 0;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to automatically maintain like counts
CREATE TRIGGER maintain_like_counts
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();

-- Populate the table with current like counts
INSERT INTO public.like_counts (content_type, content_id, like_count, updated_at)
SELECT 
  content_type,
  content_id,
  COUNT(*) as like_count,
  now() as updated_at
FROM public.likes
GROUP BY content_type, content_id;