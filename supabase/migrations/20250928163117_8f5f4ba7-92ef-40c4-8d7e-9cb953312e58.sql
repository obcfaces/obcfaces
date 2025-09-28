-- Fix participant distribution by actual contest weeks
-- First, fix the status from week-2025-09-28 to this week
UPDATE weekly_contest_participants wcp
SET admin_status = 'this week'
WHERE admin_status = 'week-2025-09-28' 
  AND is_active = true;

-- Now properly distribute participants based on their contest week dates
-- Current week (2025-09-28): should be 'this week'
UPDATE weekly_contest_participants wcp
SET admin_status = 'this week'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date = '2025-09-22'  -- Contest 22.09-28.09.2025
  AND wcp.is_active = true;

-- 1 week ago (2025-09-15): should be 'past week 1'  
UPDATE weekly_contest_participants wcp
SET admin_status = 'past week 1'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date = '2025-09-15'  -- Contest 15.09-21.09.2025
  AND wcp.is_active = true;

-- 2 weeks ago (2025-09-08): should be 'past week 2'
UPDATE weekly_contest_participants wcp
SET admin_status = 'past week 2'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date = '2025-09-08'  -- Contest 08.09-14.09.2025
  AND wcp.is_active = true;

-- 3+ weeks ago: should be 'past'
UPDATE weekly_contest_participants wcp
SET admin_status = 'past'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date < '2025-09-08'  -- Earlier contests
  AND wcp.is_active = true;