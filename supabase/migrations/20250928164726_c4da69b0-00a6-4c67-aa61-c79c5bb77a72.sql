-- Create winner content record for Jasmin (1 week ago winner) with current static content
INSERT INTO public.winner_content (
  participant_id,
  user_id,
  payment_proof_url,
  testimonial_video_url,
  testimonial_text
) VALUES (
  'f1f75987-5d25-4405-a08f-807cbda387c1',
  '0173a635-5627-4eb6-8afd-1143212e39ea',
  '/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png',
  '/assets/winner-video-april.mp4',
  'It''s legit and it''s really happening. Thank you so much, OBC, for this wonderful opportunity. And I''m really overwhelmed with happiness as one of your weekly winners. Thank you, everyone.'
);

-- Now move this content to Pisao Justine May (2 weeks ago winner) and clear Jasmin's content
UPDATE public.winner_content 
SET 
  participant_id = '057aeb09-5b2f-43fb-a0d7-b8a64da48ff0',
  user_id = 'fb35c3cf-b1c6-4c16-b1b4-28d5ffb4e92c'
WHERE participant_id = 'f1f75987-5d25-4405-a08f-807cbda387c1';