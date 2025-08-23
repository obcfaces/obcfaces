-- Remove Elena Lira from weekly contest participants
DELETE FROM weekly_contest_participants 
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942' 
  AND id IN (
    SELECT wcp.id 
    FROM weekly_contest_participants wcp
    WHERE wcp.application_data->>'first_name' = 'Elena'
      AND wcp.application_data->>'last_name' = 'Lira'
  );

-- Update profile to remove contest participant status
UPDATE profiles 
SET is_contest_participant = false
WHERE id = '1b5c2751-a820-4767-87e6-d06080219942';

-- Update contest application status to rejected if exists
UPDATE contest_applications 
SET status = 'rejected',
    notes = 'Deactivated by admin - Elena Lira',
    reviewed_by = '1b5c2751-a820-4767-87e6-d06080219942',
    reviewed_at = now()
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942';