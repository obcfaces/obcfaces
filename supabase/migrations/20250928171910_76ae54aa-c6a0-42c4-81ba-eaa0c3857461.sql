-- Move participants from "week-2025-09-28" status to "this week"
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'week-2025-09-28' 
   AND is_active = true;