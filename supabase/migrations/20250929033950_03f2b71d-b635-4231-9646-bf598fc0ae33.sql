-- Исправляем функции добавляя search_path для безопасности
CREATE OR REPLACE FUNCTION get_current_week_interval()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Исправляем функцию триггера
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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