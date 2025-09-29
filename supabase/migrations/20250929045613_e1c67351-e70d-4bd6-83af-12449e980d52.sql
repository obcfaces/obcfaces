-- Добавляем участника "next week on site" с другим user_id
INSERT INTO weekly_contest_participants (
  contest_id,
  user_id,
  application_data,
  admin_status,
  status_week_history,
  is_active
) VALUES (
  (SELECT id FROM weekly_contests WHERE status = 'active' ORDER BY week_start_date DESC LIMIT 1),
  '14cc9502-ef34-431d-8ef3-1ea9c9abfb70',
  (SELECT application_data FROM contest_applications WHERE user_id = '14cc9502-ef34-431d-8ef3-1ea9c9abfb70' AND status = 'approved' LIMIT 1),
  'next week on site',
  '{"next week on site": "29/09-05/10/25"}'::jsonb,
  true
);