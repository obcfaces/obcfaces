-- Fix the week calculation and participant statuses

-- First check what get_week_monday returns for today
SELECT get_week_monday(CURRENT_DATE) as current_monday, CURRENT_DATE as today;

-- Get current participants status for today's week
SELECT 
  wcp.admin_status,
  COUNT(*) as count,
  wc.week_start_date,
  wc.status as contest_status
FROM weekly_contest_participants wcp 
JOIN weekly_contests wc ON wcp.contest_id = wc.id 
WHERE wcp.is_active = true
  AND wc.week_start_date >= '2025-09-22'
GROUP BY wcp.admin_status, wc.week_start_date, wc.status
ORDER BY wc.week_start_date DESC;

-- Update participants for current week to have "this week" status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status IN ('past week 1', 'pending')
AND contest_id IN (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = get_week_monday(CURRENT_DATE)
  AND status = 'active'
);