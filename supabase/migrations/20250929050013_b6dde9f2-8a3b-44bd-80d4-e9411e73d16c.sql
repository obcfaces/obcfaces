-- Переводим всех участниц из "next week on site" в "this week"
-- Это симулирует еженедельный переход статусов
UPDATE weekly_contest_participants 
SET 
  admin_status = 'this week',
  status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{this week}',
    '"29/09-05/10/25"'
  )
WHERE admin_status = 'next week on site' 
  AND is_active = true;