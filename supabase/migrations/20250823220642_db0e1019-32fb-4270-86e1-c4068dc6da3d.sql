-- Restore Jin Carrida by setting her application status back to approved
UPDATE contest_applications 
SET status = 'approved',
    notes = 'Restored - Jin Carrida participant',
    reviewed_by = '1b5c2751-a820-4767-87e6-d06080219942',
    reviewed_at = now()
WHERE user_id = '1b5c2751-a820-4767-87e6-d06080219942'
  AND application_data->>'first_name' = 'Jin'
  AND application_data->>'last_name' = 'Carrida';

-- Restore profile contest participant status
UPDATE profiles 
SET is_contest_participant = true
WHERE id = '1b5c2751-a820-4767-87e6-d06080219942';