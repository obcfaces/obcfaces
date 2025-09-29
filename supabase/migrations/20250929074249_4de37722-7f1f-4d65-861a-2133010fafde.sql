-- Обновить все интервалы на правильные года
-- Текущие интервалы для 2025 года:

-- Текущая неделя (29 сентября 2025 - понедельник)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{this week}',
    to_jsonb('29/09-05/10/25'::text)
)
WHERE admin_status = 'this week';

-- Следующая неделя 
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{next week}',
    to_jsonb('06/10-12/10/25'::text)
)
WHERE admin_status = 'next week';

-- Следующая неделя на сайте
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{next week on site}',
    to_jsonb('06/10-12/10/25'::text)
)
WHERE admin_status = 'next week on site';

-- Прошлая неделя (22-28 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past}',
    to_jsonb('22/09-28/09/25'::text)
)
WHERE admin_status = 'past';

-- Прошлая неделя 1
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 1}',
    to_jsonb('22/09-28/09/25'::text)
)
WHERE admin_status = 'past week 1';

-- Прошлая неделя 2 (15-21 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 2}',
    to_jsonb('15/09-21/09/25'::text)
)
WHERE admin_status = 'past week 2';

-- Прошлая неделя 3 (8-14 сентября 2025)  
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 3}',
    to_jsonb('08/09-14/09/25'::text)
)
WHERE admin_status = 'past week 3';

-- Pending статус - текущая неделя
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{pending}',
    to_jsonb('29/09-05/10/25'::text)
)
WHERE admin_status = 'pending';

-- Обновляем week_interval для всех записей
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