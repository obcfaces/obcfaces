-- Create participants for current week (22-28 September) from next week participants

-- First, get the contest ID for current week (22-28 Sept)
WITH current_week_contest AS (
  SELECT id as contest_id FROM weekly_contests 
  WHERE week_start_date = '2025-09-22' 
  LIMIT 1
),
next_week_participants AS (
  SELECT DISTINCT ON (user_id) *
  FROM weekly_contest_participants 
  WHERE contest_id IN (
    SELECT id FROM weekly_contests 
    WHERE week_start_date IN ('2025-09-23', '2025-09-28')
  )
  AND is_active = true
)
INSERT INTO weekly_contest_participants (
  id,
  contest_id,
  user_id,
  application_data,
  final_rank,
  total_votes,
  average_rating,
  is_active,
  admin_status
)
SELECT 
  gen_random_uuid(),
  (SELECT contest_id FROM current_week_contest),
  nwp.user_id,
  nwp.application_data,
  NULL as final_rank,
  0 as total_votes,
  0 as average_rating,
  true as is_active,
  'this week' as admin_status
FROM next_week_participants nwp
CROSS JOIN current_week_contest
WHERE NOT EXISTS (
  SELECT 1 FROM weekly_contest_participants existing
  WHERE existing.contest_id = (SELECT contest_id FROM current_week_contest)
  AND existing.user_id = nwp.user_id
);