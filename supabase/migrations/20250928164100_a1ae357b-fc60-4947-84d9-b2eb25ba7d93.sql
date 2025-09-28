-- Create table for winner additional content (payment proofs, videos, testimonials)
CREATE TABLE public.winner_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  payment_proof_url TEXT,
  testimonial_video_url TEXT,
  testimonial_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.winner_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Winner content is viewable by everyone" 
ON public.winner_content 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage winner content" 
ON public.winner_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for timestamps
CREATE TRIGGER update_winner_content_updated_at
BEFORE UPDATE ON public.winner_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_winner_content_participant_id ON public.winner_content(participant_id);
CREATE INDEX idx_winner_content_user_id ON public.winner_content(user_id);