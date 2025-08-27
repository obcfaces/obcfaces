-- Fix the specific user's profile that still shows contest participation
UPDATE profiles 
SET is_contest_participant = false, participant_type = null 
WHERE id = '1b5c2751-a820-4767-87e6-d06080219942';