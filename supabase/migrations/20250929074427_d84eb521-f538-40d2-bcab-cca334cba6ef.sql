-- Исправить все прошлые интервалы недель
-- Если текущая неделя 29/09-05/10/25, то прошлые недели должны быть:

-- Удалить все неправильные статусы и интервалы сначала
UPDATE weekly_contest_participants 
SET status_week_history = '{}'::jsonb
WHERE status_week_history::text LIKE '%23/09-29/09/25%' 
   OR status_week_history::text LIKE '%week-2025-09-23%';

-- Установить правильные интервалы для всех прошлых статусов
-- past = прошлая неделя (22-28 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past}',
    to_jsonb('22/09-28/09/25'::text)
)
WHERE admin_status = 'past';

-- past week 1 = прошлая неделя (22-28 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 1}',
    to_jsonb('22/09-28/09/25'::text)
)
WHERE admin_status = 'past week 1';

-- past week 2 = 2 недели назад (15-21 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 2}',
    to_jsonb('15/09-21/09/25'::text)
)
WHERE admin_status = 'past week 2';

-- past week 3 = 3 недели назад (8-14 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 3}',
    to_jsonb('08/09-14/09/25'::text)
)
WHERE admin_status = 'past week 3';

-- past week 4 = 4 недели назад (1-7 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 4}',
    to_jsonb('01/09-07/09/25'::text)
)
WHERE admin_status = 'past week 4';

-- Обновить week_interval тоже
UPDATE weekly_contest_participants 
SET week_interval = CASE 
  WHEN admin_status = 'past' THEN '22/09-28/09/25'
  WHEN admin_status = 'past week 1' THEN '22/09-28/09/25'
  WHEN admin_status = 'past week 2' THEN '15/09-21/09/25'
  WHEN admin_status = 'past week 3' THEN '08/09-14/09/25'
  WHEN admin_status = 'past week 4' THEN '01/09-07/09/25'
  ELSE week_interval
END
WHERE admin_status IN ('past', 'past week 1', 'past week 2', 'past week 3', 'past week 4');

-- Удалить любые записи с неправильными статусами вида "week-2025-09-23"
UPDATE weekly_contest_participants 
SET admin_status = 'past'
WHERE admin_status LIKE 'week-2025-%';