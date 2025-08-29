-- Update the weekly_contest_participants record for the approved user to be active
UPDATE weekly_contest_participants 
SET is_active = true 
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942' 
  AND contest_id = '4f917ba7-f16a-419f-a293-b19172abff6c';