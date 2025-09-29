-- Добавляем пару участников как "next week on site" для демонстрации перехода
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
  'next week on site',
  '{"next week on site": "29/09-05/10/25"}'::jsonb,
  true
FROM contest_applications ca
WHERE ca.status = 'approved' 
  AND ca.is_active = true 
  AND ca.deleted_at IS NULL
  AND ca.user_id IN (
    '5984ec6b-84fc-465d-840c-72f28033a587', -- analyn faith
    '14cc9502-ef34-431d-8ef3-1ea9c9abfb70'  -- Gracia Cee
  )
  AND NOT EXISTS (
    SELECT 1 FROM weekly_contest_participants wcp 
    WHERE wcp.user_id = ca.user_id AND wcp.is_active = true
  );