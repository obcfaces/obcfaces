-- ИСПРАВЛЕНИЕ БЕЗ УДАЛЕНИЯ ЗАПИСЕЙ (сначала исправим данные)

-- 1. ПОЛНОСТЬЮ ОЧИСТИТЬ ВСЕ НЕПРАВИЛЬНЫЕ ИНТЕРВАЛЫ У ВСЕХ УЧАСТНИКОВ
UPDATE weekly_contest_participants 
SET status_week_history = '{}'::jsonb,
    week_interval = NULL;

-- 2. УСТАНОВИТЬ ПРАВИЛЬНЫЕ ИНТЕРВАЛЫ ДЛЯ КАЖДОГО СТАТУСА
-- Текущая неделя (понедельник 29 сентября - воскресенье 5 октября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('this week', '29/09-05/10/25'),
    week_interval = '29/09-05/10/25'
WHERE admin_status = 'this week';

-- Следующая неделя (понедельник 6 октября - воскресенье 12 октября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('next week', '06/10-12/10/25'),
    week_interval = '06/10-12/10/25'
WHERE admin_status = 'next week';

-- Следующая неделя на сайте (понедельник 6 октября - воскресенье 12 октября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('next week on site', '06/10-12/10/25'),
    week_interval = '06/10-12/10/25'
WHERE admin_status = 'next week on site';

-- Прошлая неделя (понедельник 22 сентября - воскресенье 28 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('past', '22/09-28/09/25'),
    week_interval = '22/09-28/09/25'
WHERE admin_status = 'past';

-- Прошлая неделя 1 (понедельник 22 сентября - воскресенье 28 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('past week 1', '22/09-28/09/25'),
    week_interval = '22/09-28/09/25'
WHERE admin_status = 'past week 1';

-- Прошлая неделя 2 (понедельник 15 сентября - воскресенье 21 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('past week 2', '15/09-21/09/25'),
    week_interval = '15/09-21/09/25'
WHERE admin_status = 'past week 2';

-- Прошлая неделя 3 (понедельник 8 сентября - воскресенье 14 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('past week 3', '08/09-14/09/25'),
    week_interval = '08/09-14/09/25'
WHERE admin_status = 'past week 3';

-- Прошлая неделя 4 (понедельник 1 сентября - воскресенье 7 сентября 2025)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('past week 4', '01/09-07/09/25'),
    week_interval = '01/09-07/09/25'
WHERE admin_status = 'past week 4';

-- В ожидании (текущая неделя)
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object('pending', '29/09-05/10/25'),
    week_interval = '29/09-05/10/25'
WHERE admin_status = 'pending';

-- 3. ИСПРАВИТЬ НЕПРАВИЛЬНЫЕ СТАТУСЫ
UPDATE weekly_contest_participants 
SET admin_status = 'past',
    status_week_history = jsonb_build_object('past', '22/09-28/09/25'),
    week_interval = '22/09-28/09/25'
WHERE admin_status LIKE 'week-2025-%';