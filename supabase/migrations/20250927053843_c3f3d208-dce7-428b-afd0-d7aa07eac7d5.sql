-- Move participants back to this week from past week 1
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'past week 1' 
  AND is_active = true;