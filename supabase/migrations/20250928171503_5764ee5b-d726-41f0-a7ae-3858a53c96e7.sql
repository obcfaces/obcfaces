-- Update April Rose Jaluag's payment proof to use the correct April payment image
UPDATE winner_content 
SET payment_proof_url = 'winner-payment-april'
WHERE payment_proof_url = 'jasmin-payment-proof';