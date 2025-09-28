-- Move participants with "week-2025-09-28" status to "this week" 
-- These are the participants for current week (2025-09-28)
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'week-2025-09-28'
AND contest_id IN (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-28'
  AND status = 'active'
);

-- Also update any pending participants for current week
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'pending'
AND contest_id IN (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-28'
  AND status = 'active'
);

-- Test the function again
SELECT COUNT(*) as this_week_participants 
FROM get_weekly_contest_participants_public(0);