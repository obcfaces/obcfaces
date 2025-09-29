-- Симулируем переход из "next week on site" в "this week" 
-- Обновляем статус Gracia Cee с "next week on site" на "this week"
UPDATE weekly_contest_participants 
SET 
  admin_status = 'this week',
  status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{this week}',
    '"29/09-05/10/25"'
  )
WHERE id = 'c6fc35dc-ccaf-4ed9-86e6-7219b7dfc68e';