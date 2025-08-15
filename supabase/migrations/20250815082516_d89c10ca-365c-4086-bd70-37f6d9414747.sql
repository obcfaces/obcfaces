-- Create table to track user interactions with next week candidates
CREATE TABLE public.next_week_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, candidate_name)
);

-- Enable Row Level Security
ALTER TABLE public.next_week_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own votes" 
ON public.next_week_votes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own votes" 
ON public.next_week_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.next_week_votes 
FOR UPDATE 
USING (auth.uid() = user_id);