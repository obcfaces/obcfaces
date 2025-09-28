-- Fix weekly transitions properly
-- Current Monday is 2025-09-30, so participants should be distributed as follows:

-- Participants from week 2025-09-22 (last week) should be 'past week 1' (1 week ago)
UPDATE weekly_contest_participants wcp
SET admin_status = 'past week 1'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date = '2025-09-22'  -- Last week (22-28 Sep)
  AND wcp.is_active = true;

-- Participants from week 2025-09-15 (2 weeks ago) should be 'past week 2' 
UPDATE weekly_contest_participants wcp
SET admin_status = 'past week 2'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date = '2025-09-15'  -- 2 weeks ago (15-21 Sep)
  AND wcp.is_active = true;

-- Participants from week 2025-09-08 (3 weeks ago) should be 'past'
UPDATE weekly_contest_participants wcp
SET admin_status = 'past'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date = '2025-09-08'  -- 3 weeks ago (8-14 Sep)
  AND wcp.is_active = true;

-- Participants from earlier weeks should also be 'past'
UPDATE weekly_contest_participants wcp
SET admin_status = 'past'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id 
  AND wc.week_start_date < '2025-09-08'  -- Earlier than 3 weeks ago
  AND wcp.is_active = true;

-- Only participants with status 'next week on site' or current week should be 'this week'
-- Current week participants (those who were moved from 'next week on site')
-- should keep their 'this week' status