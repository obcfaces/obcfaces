-- Добавляем поле для хранения истории статусов с интервалами недель
ALTER TABLE weekly_contest_participants 
ADD COLUMN IF NOT EXISTS status_week_history JSONB DEFAULT '{}';

-- Обновляем admin_status чтобы использовать только основные статусы
-- Сначала исправляем нестандартные статусы
UPDATE weekly_contest_participants 
SET admin_status = CASE 
  WHEN admin_status = 'week-2025-09-23' THEN 'past'
  WHEN admin_status = 'week-2025-09-28' THEN 'past'
  WHEN admin_status = 'past week 1' THEN 'past'
  WHEN admin_status = 'past week 2' THEN 'past'
  ELSE admin_status
END;

-- Функция для получения интервала текущей недели в формате DD/MM-DD/MM/YY
CREATE OR REPLACE FUNCTION get_current_week_interval()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  monday_date DATE;
  sunday_date DATE;
  week_interval TEXT;
BEGIN
  -- Получаем понедельник текущей недели (начало недели)
  monday_date := date_trunc('week', CURRENT_DATE);
  -- Получаем воскресенье (конец недели)
  sunday_date := monday_date + INTERVAL '6 days';
  
  -- Формируем интервал в нужном формате
  week_interval := TO_CHAR(monday_date, 'DD/MM') || '-' || TO_CHAR(sunday_date, 'DD/MM/YY');
  
  RETURN week_interval;
END;
$$;

-- Функция для записи статуса в историю с интервалом недели
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_week_interval TEXT;
BEGIN
  -- Получаем текущий интервал недели
  current_week_interval := get_current_week_interval();
  
  -- Если статус изменился, записываем в историю
  IF OLD.admin_status IS DISTINCT FROM NEW.admin_status THEN
    NEW.status_week_history := COALESCE(NEW.status_week_history, '{}'::jsonb) || 
      jsonb_build_object(NEW.admin_status, current_week_interval);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для автоматической записи изменений статуса
DROP TRIGGER IF EXISTS trigger_record_status_change ON weekly_contest_participants;
CREATE TRIGGER trigger_record_status_change
  BEFORE UPDATE ON weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION record_status_change();

-- Инициализируем историю для существующих записей
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_build_object(admin_status, get_current_week_interval())
WHERE status_week_history IS NULL OR status_week_history = '{}'::jsonb;