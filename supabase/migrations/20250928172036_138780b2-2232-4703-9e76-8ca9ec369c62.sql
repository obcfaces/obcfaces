-- Move Charmel Cabiles to "this week" status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE application_data->>'first_name' = 'Charmel  '
   AND application_data->>'last_name' = 'Cabiles '
   AND is_active = true;