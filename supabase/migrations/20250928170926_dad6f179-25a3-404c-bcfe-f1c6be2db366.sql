-- Update participants who had "next week on site" status to "this week"
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE status_history::text ILIKE '%next week on site%' 
AND admin_status != 'this week';