-- Hide the test participant card and move "next week on site" participants to "this week"

-- First, deactivate the test participant
UPDATE weekly_contest_participants 
SET is_active = false 
WHERE application_data->>'first_name' = 'test21-09-03' 
   AND application_data->>'last_name' = 'test';

-- Move all participants from "next week on site" status to "this week"
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'next week on site' 
   AND is_active = true;