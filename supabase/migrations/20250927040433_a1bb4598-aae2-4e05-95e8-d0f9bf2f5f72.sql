-- Обновляем статусы участников для правильных недель
-- Текущая неделя: 22.09-28.09 - "this week"
-- Прошлая неделя: 15.09-21.09 - "past week 1" 
-- Позапрошлая неделя: 08.09-14.09 - "past week 2"
-- Старые недели: "past week 3" и так далее

-- Обновляем участников текущей недели (22.09-28.09)
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-22'
);

-- Создаем прошлую неделю 15.09-21.09 если она не существует
INSERT INTO weekly_contests (week_start_date, week_end_date, title, status)
VALUES ('2025-09-15', '2025-09-21', 'Contest 15.09-21.09.2025', 'closed')
ON CONFLICT DO NOTHING;

-- Обновляем участников позапрошлой недели (08.09-14.09)
UPDATE weekly_contest_participants 
SET admin_status = 'past week 2'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-08'
);

-- Обновляем участников старой недели (18.08-24.08)
UPDATE weekly_contest_participants 
SET admin_status = 'past week 3'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-08-18'
);

-- Обновляем функцию для правильного назначения статусов
CREATE OR REPLACE FUNCTION public.auto_assign_participant_status()
RETURNS TRIGGER AS $$
DECLARE
  contest_week_start DATE;
  current_week_monday DATE;
  weeks_diff INTEGER;
BEGIN
  -- Получаем дату начала недели конкурса
  SELECT week_start_date INTO contest_week_start
  FROM weekly_contests 
  WHERE id = NEW.contest_id;
  
  -- Текущий понедельник (22 сентября 2025)
  current_week_monday := '2025-09-22'::DATE;
  
  -- Вычисляем разницу в неделях
  weeks_diff := EXTRACT(EPOCH FROM (contest_week_start - current_week_monday)) / (7 * 24 * 3600);
  
  -- Назначаем статус в зависимости от недели конкурса
  IF contest_week_start = current_week_monday THEN
    NEW.admin_status := 'this week';
  ELSIF contest_week_start > current_week_monday THEN
    NEW.admin_status := 'next week';
  ELSIF weeks_diff = -1 THEN
    NEW.admin_status := 'past week 1';
  ELSIF weeks_diff = -2 THEN
    NEW.admin_status := 'past week 2';
  ELSIF weeks_diff <= -3 THEN
    NEW.admin_status := 'past week 3';
  ELSE
    NEW.admin_status := CONCAT('week-', TO_CHAR(contest_week_start, 'DD/MM/YYYY'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;