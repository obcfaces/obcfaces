-- Create shares table for tracking content shares
CREATE TABLE IF NOT EXISTS public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'contest',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Create policies for shares
CREATE POLICY "Users can view all shares" 
ON public.shares 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own shares" 
ON public.shares 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares" 
ON public.shares 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_shares_content ON public.shares(content_id, content_type);
CREATE INDEX idx_shares_user ON public.shares(user_id);