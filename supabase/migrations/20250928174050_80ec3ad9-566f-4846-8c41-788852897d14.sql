-- Fix the active contest week - set the correct week (2025-09-28) as active
-- and deactivate the previous weeks

-- First, set all contests to closed
UPDATE weekly_contests 
SET status = 'closed' 
WHERE status = 'active';

-- Then set the current week (where our participants are) as active
UPDATE weekly_contests 
SET status = 'active'
WHERE week_start_date = '2025-09-28';

-- Verify the fix
SELECT 
  week_start_date,
  status,
  id
FROM weekly_contests 
ORDER BY week_start_date DESC;