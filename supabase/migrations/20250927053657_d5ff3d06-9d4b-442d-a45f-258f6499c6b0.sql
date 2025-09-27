-- Move all current week participants to past week 1 (15-21 September 2025)
UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE admin_status = 'this week' 
  AND is_active = true;