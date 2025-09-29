-- Добавляем некоторые approved заявки как участников "this week"
INSERT INTO weekly_contest_participants (
  contest_id,
  user_id,
  application_data,
  admin_status,
  status_week_history,
  is_active
)
SELECT 
  (SELECT id FROM weekly_contests WHERE status = 'active' ORDER BY week_start_date DESC LIMIT 1),
  ca.user_id,
  ca.application_data,
  'this week',
  '{"this week": "29/09-05/10/25"}'::jsonb,
  true
FROM contest_applications ca
WHERE ca.status = 'approved' 
  AND ca.is_active = true 
  AND ca.deleted_at IS NULL
  AND ca.user_id IN (
    'b44f50a6-b532-4dc5-8307-356ea859875e', -- Rige Mae Geraldino
    '40c2520b-8ce6-4d81-8495-bedc821fde1e', -- Lyka Wali  
    'fb35c3cf-b1c6-4c16-b1b4-28d5ffb4e92c'  -- Pisao Justine May
  )
  AND NOT EXISTS (
    SELECT 1 FROM weekly_contest_participants wcp 
    WHERE wcp.user_id = ca.user_id AND wcp.is_active = true
  );