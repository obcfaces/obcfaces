-- Update winner content with correct image URLs that should be from Jasmin Carriaga
UPDATE winner_content 
SET 
  payment_proof_url = '/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png',
  testimonial_video_url = '/assets/winner-video-april.mp4'
WHERE participant_id = '68eb6871-1dd9-4719-a026-dd4c63bd2894';