-- Fix application statuses for current week participants
-- For participants who are already in "this week", their applications should be "approved"
UPDATE contest_applications 
SET status = 'approved'
WHERE user_id IN (
  SELECT wcp.user_id 
  FROM weekly_contest_participants wcp 
  JOIN weekly_contests wc ON wcp.contest_id = wc.id 
  WHERE wc.week_start_date = '2025-09-28'
  AND wcp.admin_status = 'this week'
  AND wcp.is_active = true
)
AND status != 'approved';

-- Test the function again
SELECT 
  participant_id, 
  first_name, 
  last_name, 
  average_rating, 
  total_votes
FROM get_weekly_contest_participants_public(0) 
LIMIT 5;