-- Добавляем еще одного участника "next week on site" для тестирования перехода
INSERT INTO weekly_contest_participants (
  contest_id,
  user_id,
  application_data,
  admin_status,
  status_week_history,
  is_active
) VALUES (
  (SELECT id FROM weekly_contests WHERE status = 'active' ORDER BY week_start_date DESC LIMIT 1),
  '5984ec6b-84fc-465d-840c-72f28033a587',
  (SELECT application_data FROM contest_applications WHERE user_id = '5984ec6b-84fc-465d-840c-72f28033a587' AND status = 'approved' LIMIT 1),
  'next week on site',
  '{"next week on site": "29/09-05/10/25"}'::jsonb,
  true
);