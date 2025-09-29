-- Исправление данных после некорректного перехода

-- 1. Создать активный конкурс
INSERT INTO weekly_contests (week_start_date, week_end_date, title, status)
VALUES ('2025-09-29', '2025-10-05', 'Contest 29 Sep-05 Oct 2025', 'active')
ON CONFLICT DO NOTHING;

-- 2. Восстановить корректные статусы участников
-- Вернуть 5 участников из "past week 3" в "this week" 
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE id IN (
  SELECT id FROM weekly_contest_participants 
  WHERE admin_status = 'past week 3' AND is_active = true
  ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
  LIMIT 5
);

-- Создать участников для "past week 1" - 10 лучших по рейтингу
UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE id IN (
  SELECT id FROM weekly_contest_participants 
  WHERE admin_status = 'past' AND is_active = true
  ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
  LIMIT 10
);

-- Создать участников для "past week 2" - следующие 10 по времени создания
UPDATE weekly_contest_participants 
SET admin_status = 'past week 2'
WHERE id IN (
  SELECT id FROM weekly_contest_participants 
  WHERE admin_status = 'past' AND is_active = true
  ORDER BY created_at
  LIMIT 10
);

-- 3. Проверить результат
SELECT admin_status, COUNT(*) as count 
FROM weekly_contest_participants 
WHERE is_active = true 
GROUP BY admin_status 
ORDER BY admin_status;