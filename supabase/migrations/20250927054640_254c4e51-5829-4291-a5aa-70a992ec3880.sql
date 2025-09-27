-- Create weekly contest for 1 week ago if it doesn't exist
WITH target_week AS (
  SELECT get_week_monday((CURRENT_DATE - INTERVAL '7 days')::date) as week_start
),
contest_check AS (
  SELECT 
    tw.week_start,
    tw.week_start + INTERVAL '6 days' as week_end,
    COALESCE(wc.id, gen_random_uuid()) as contest_id,
    CASE WHEN wc.id IS NULL THEN true ELSE false END as needs_insert
  FROM target_week tw
  LEFT JOIN weekly_contests wc ON wc.week_start_date = tw.week_start
)
INSERT INTO weekly_contests (id, week_start_date, week_end_date, title, status)
SELECT 
  contest_id,
  week_start,
  (week_end)::date,
  'Contest ' || TO_CHAR(week_start, 'DD.MM') || '-' || TO_CHAR(week_end, 'DD.MM.YYYY'),
  'closed'
FROM contest_check 
WHERE needs_insert = true;

-- Insert approved users from contest_applications into weekly_contest_participants for past week 1
WITH target_contest AS (
  SELECT id as contest_id
  FROM weekly_contests 
  WHERE week_start_date = get_week_monday((CURRENT_DATE - INTERVAL '7 days')::date)
),
approved_users AS (
  SELECT DISTINCT
    ca.user_id,
    ca.application_data
  FROM contest_applications ca
  WHERE ca.status = 'approved'
    AND ca.is_active = true
    AND ca.deleted_at IS NULL
    -- Only users who are not already in weekly_contest_participants
    AND NOT EXISTS (
      SELECT 1 FROM weekly_contest_participants wcp 
      WHERE wcp.user_id = ca.user_id
    )
)
INSERT INTO weekly_contest_participants (
  contest_id,
  user_id,
  application_data,
  admin_status,
  is_active,
  average_rating,
  total_votes
)
SELECT 
  tc.contest_id,
  au.user_id,
  au.application_data,
  'past week 1',
  true,
  0,
  0
FROM approved_users au
CROSS JOIN target_contest tc;