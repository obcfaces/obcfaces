-- Исправить все интервалы на ПРАВИЛЬНЫЕ понедельник-воскресенье для 2025 года
-- 23 сентября 2025 - это ВТОРНИК, а нам нужны недели с понедельника!

-- Найдем правильные понедельники для сентября-октября 2025:
-- Понедельник 22 сентября 2025 - неделя 22/09-28/09/25 (прошлая неделя)
-- Понедельник 29 сентября 2025 - неделя 29/09-05/10/25 (текущая неделя)
-- Понедельник 6 октября 2025 - неделя 06/10-12/10/25 (следующая неделя)

-- Обновить все status_week_history на правильные интервалы
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{this week}',
    to_jsonb('29/09-05/10/25'::text)
)
WHERE admin_status = 'this week';

UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{next week}',
    to_jsonb('06/10-12/10/25'::text)
)
WHERE admin_status = 'next week';

UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{next week on site}',
    to_jsonb('06/10-12/10/25'::text)
)
WHERE admin_status = 'next week on site';

UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past}',
    to_jsonb('22/09-28/09/25'::text)
)
WHERE admin_status = 'past';

UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 1}',
    to_jsonb('22/09-28/09/25'::text)
)
WHERE admin_status = 'past week 1';

UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 2}',
    to_jsonb('15/09-21/09/25'::text)
)
WHERE admin_status = 'past week 2';

UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 3}',
    to_jsonb('08/09-14/09/25'::text)
)
WHERE admin_status = 'past week 3';

-- Также обновить week_interval
UPDATE weekly_contest_participants 
SET week_interval = CASE 
  WHEN admin_status = 'this week' THEN '29/09-05/10/25'
  WHEN admin_status = 'next week' THEN '06/10-12/10/25'
  WHEN admin_status = 'next week on site' THEN '06/10-12/10/25'
  WHEN admin_status = 'past' THEN '22/09-28/09/25'
  WHEN admin_status = 'past week 1' THEN '22/09-28/09/25'
  WHEN admin_status = 'past week 2' THEN '15/09-21/09/25'
  WHEN admin_status = 'past week 3' THEN '08/09-14/09/25'
  WHEN admin_status = 'pending' THEN '29/09-05/10/25'
  ELSE '29/09-05/10/25'
END;