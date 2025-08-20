-- Create ratings table for contest participants
CREATE TABLE public.contestant_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contestant_name TEXT NOT NULL,
  contestant_user_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contestant_name, contestant_user_id)
);

-- Enable RLS
ALTER TABLE public.contestant_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all ratings" 
ON public.contestant_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own ratings" 
ON public.contestant_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.contestant_ratings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to get average rating for a contestant
CREATE OR REPLACE FUNCTION public.get_contestant_average_rating(contestant_name_param TEXT, contestant_user_id_param UUID DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1)
  FROM public.contestant_ratings 
  WHERE contestant_name = contestant_name_param 
    AND (contestant_user_id_param IS NULL OR contestant_user_id = contestant_user_id_param);
$$;

-- Create trigger for updating updated_at
CREATE TRIGGER update_contestant_ratings_updated_at
BEFORE UPDATE ON public.contestant_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();