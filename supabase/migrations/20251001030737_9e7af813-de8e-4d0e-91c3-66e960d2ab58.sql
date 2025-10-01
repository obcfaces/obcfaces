-- Update participants with 'approved' status to 'this week' for current week contest
UPDATE weekly_contest_participants
SET admin_status = 'this week'
WHERE admin_status = 'approved' 
  AND is_active = true
  AND contest_id IN (
    SELECT id FROM weekly_contests 
    WHERE week_start_date = '2025-09-29' 
    AND status = 'active'
  );