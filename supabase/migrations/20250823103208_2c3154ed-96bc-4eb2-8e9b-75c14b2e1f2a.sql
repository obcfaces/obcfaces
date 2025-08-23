-- Update profiles to mark contest participants
UPDATE profiles 
SET is_contest_participant = true
WHERE id IN (
  SELECT DISTINCT wcp.user_id
  FROM weekly_contest_participants wcp
  JOIN weekly_contests wc ON wcp.contest_id = wc.id
  WHERE wc.status = 'active'
    AND CURRENT_DATE BETWEEN wc.week_start_date AND wc.week_end_date
);