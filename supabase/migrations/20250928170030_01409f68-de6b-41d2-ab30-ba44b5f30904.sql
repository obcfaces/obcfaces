-- Update winner content to reference the imported image from Jasmin
UPDATE winner_content 
SET 
  payment_proof_url = 'jasmin-payment-proof',
  testimonial_video_url = 'winner-video-april'
WHERE participant_id = '68eb6871-1dd9-4719-a026-dd4c63bd2894';