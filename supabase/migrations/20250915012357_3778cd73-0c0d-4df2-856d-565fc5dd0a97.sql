-- Close the previous contest and set winner
UPDATE weekly_contests 
SET status = 'closed', 
    winner_id = (
      SELECT wcp.user_id 
      FROM weekly_contest_participants wcp 
      WHERE wcp.contest_id = '292653f9-3e93-486e-a531-bd324afaf40e'
      ORDER BY wcp.average_rating DESC, wcp.total_votes DESC 
      LIMIT 1
    ),
    updated_at = now()
WHERE id = '292653f9-3e93-486e-a531-bd324afaf40e';

-- Create new contest for this week (16 Sep - 22 Sep 2025)
INSERT INTO weekly_contests (
  id,
  title,
  week_start_date,
  week_end_date,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Contest 16 Sep - 22 Sep 2025',
  '2025-09-16',
  '2025-09-22', 
  'active',
  now(),
  now()
);