-- Update participants from "next week" status to "this week" 
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'next week';