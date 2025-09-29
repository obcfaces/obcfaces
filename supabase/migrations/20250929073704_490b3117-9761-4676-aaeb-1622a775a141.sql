-- Полностью исправить все интервалы с неправильным годом 2025 на 2024
-- И установить правильные недельные интервалы

-- Обновляем все записи где есть 2025 год в любом статусе
UPDATE weekly_contest_participants 
SET status_week_history = (
  SELECT jsonb_object_agg(
    key,
    CASE 
      WHEN key = 'past' THEN '23/09-29/09/24'
      WHEN key = 'past week 1' THEN '23/09-29/09/24'
      WHEN key = 'past week 2' THEN '16/09-22/09/24'
      WHEN key = 'this week' THEN '23/09-29/09/24'
      WHEN key = 'next week' THEN '30/09-06/10/24'
      WHEN key = 'next week on site' THEN '30/09-06/10/24'
      WHEN key = 'pending' THEN '23/09-29/09/24'
      ELSE value::text
    END
  )
  FROM jsonb_each_text(status_week_history)
)
WHERE status_week_history::text LIKE '%25%';

-- Также обновляем записи где могут быть null или пустые значения
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object(
  admin_status,
  CASE 
    WHEN admin_status = 'past' THEN '23/09-29/09/24'
    WHEN admin_status = 'past week 1' THEN '23/09-29/09/24'
    WHEN admin_status = 'past week 2' THEN '16/09-22/09/24'
    WHEN admin_status = 'this week' THEN '23/09-29/09/24'
    WHEN admin_status = 'next week' THEN '30/09-06/10/24'
    WHEN admin_status = 'next week on site' THEN '30/09-06/10/24'
    WHEN admin_status = 'pending' THEN '23/09-29/09/24'
    ELSE '23/09-29/09/24'
  END
)
WHERE status_week_history IS NULL OR status_week_history = '{}';

-- Убедимся что все week_interval тоже правильные
UPDATE weekly_contest_participants 
SET week_interval = CASE 
  WHEN admin_status = 'past' THEN '23/09-29/09/24'
  WHEN admin_status = 'past week 1' THEN '23/09-29/09/24'
  WHEN admin_status = 'past week 2' THEN '16/09-22/09/24'
  WHEN admin_status = 'this week' THEN '23/09-29/09/24'
  WHEN admin_status = 'next week' THEN '30/09-06/10/24'
  WHEN admin_status = 'next week on site' THEN '30/09-06/10/24'
  WHEN admin_status = 'pending' THEN '23/09-29/09/24'
  ELSE '23/09-29/09/24'
END
WHERE week_interval IS NULL OR week_interval LIKE '%25%';