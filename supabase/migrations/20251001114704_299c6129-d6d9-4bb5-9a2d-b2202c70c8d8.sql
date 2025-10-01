-- Move old "this week" participants from closed contests to "past" status
UPDATE weekly_contest_participants wcp
SET admin_status = 'past'
FROM weekly_contests wc
WHERE wcp.contest_id = wc.id
  AND wcp.admin_status = 'this week'
  AND wc.status = 'closed';

-- Create or update active contest for current week (29 Sep - 05 Oct 2025)
INSERT INTO weekly_contests (id, week_start_date, week_end_date, title, status)
VALUES (
  '854cafaf-7042-465e-8d93-fbf175cb9b7f',
  '2025-09-29',
  '2025-10-05',
  'Contest 29 Sep - 05 Oct 2025',
  'active'
)
ON CONFLICT (id) 
DO UPDATE SET 
  status = 'active',
  updated_at = now();