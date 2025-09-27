-- Исправляем все недели в соответствии с правильным календарем (понедельник-воскресенье)
-- Сегодня 27 сентября 2025 (пятница)
-- Текущая неделя: 22.09-28.09 (понедельник-воскресенье)
-- Прошлая неделя: 15.09-21.09 (понедельник-воскресенье) 
-- Позапрошлая неделя: 08.09-14.09 (понедельник-воскресенье)

-- Удаляем неправильные недели
DELETE FROM weekly_contest_participants WHERE contest_id IN (
  '56b561eb-55c3-4601-913e-d1e0634255bc',  -- 25.08-31.08 (неправильно)
  '4f917ba7-f16a-419f-a293-b19172abff6c',  -- 26.08-01.09 (неправильно)
  '7794699a-2976-4fb2-bd51-97764a7c845c',  -- 16.09-22.09 (неправильно)
  '31777f1a-98d0-4ab5-9894-086993ed3d9f',  -- 23.09-29.09 (неправильно)
  'cbc1a28c-d19a-415a-bf17-853bd062ece8'   -- 30.09-06.10 (неправильно)
);

-- Удаляем неправильные конкурсы
DELETE FROM weekly_contests WHERE id IN (
  '56b561eb-55c3-4601-913e-d1e0634255bc',  -- 25.08-31.08
  '4f917ba7-f16a-419f-a293-b19172abff6c',  -- 26.08-01.09
  '7794699a-2976-4fb2-bd51-97764a7c845c',  -- 16.09-22.09
  '31777f1a-98d0-4ab5-9894-086993ed3d9f',  -- 23.09-29.09
  'cbc1a28c-d19a-415a-bf17-853bd062ece8'   -- 30.09-06.10
);

-- Исправляем оставшиеся недели на правильные даты
-- Исправляем позапрошлую неделю (была 09.09-15.09, должна быть 08.09-14.09)
UPDATE weekly_contests 
SET week_start_date = '2025-09-08',
    week_end_date = '2025-09-14',
    title = 'Contest 08.09-14.09.2025',
    status = 'closed'
WHERE id = '292653f9-3e93-486e-a531-bd324afaf40e';

-- Создаем прошлую неделю 15.09-21.09 (закрытая)
INSERT INTO weekly_contests (week_start_date, week_end_date, title, status)
VALUES ('2025-09-15', '2025-09-21', 'Contest 15.09-21.09.2025', 'closed')
ON CONFLICT DO NOTHING;

-- Убеждаемся что текущая неделя 22.09-28.09 правильная (уже есть)
UPDATE weekly_contests 
SET status = 'active'
WHERE week_start_date = '2025-09-22';

-- Создаем/обновляем следующую неделю 29.09-05.10
UPDATE weekly_contests 
SET week_end_date = '2025-10-05',
    title = 'Contest 29.09-05.10.2025',
    status = 'upcoming'
WHERE week_start_date = '2025-09-29';

-- Обновляем функцию автоназначения статуса
CREATE OR REPLACE FUNCTION public.auto_assign_participant_status()
RETURNS TRIGGER AS $$
DECLARE
  contest_week_start DATE;
  current_week_monday DATE;
BEGIN
  -- Получаем дату начала недели конкурса
  SELECT week_start_date INTO contest_week_start
  FROM weekly_contests 
  WHERE id = NEW.contest_id;
  
  -- Текущий понедельник (22 сентября 2025)
  current_week_monday := '2025-09-22'::DATE;
  
  -- Назначаем статус в зависимости от недели конкурса
  IF contest_week_start = current_week_monday THEN
    NEW.admin_status := 'this week';
  ELSIF contest_week_start > current_week_monday THEN
    NEW.admin_status := 'next';
  ELSE
    NEW.admin_status := CONCAT('week-', TO_CHAR(contest_week_start, 'DD/MM/YYYY'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;