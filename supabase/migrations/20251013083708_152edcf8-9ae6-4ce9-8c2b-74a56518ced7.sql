-- ПРАВИЛЬНАЯ реализация: конвертируем в WITA, находим понедельник, возвращаем в UTC
CREATE OR REPLACE FUNCTION public.week_start_wita(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
DECLARE
  wita_time TIMESTAMP;
  day_of_week INT;
  monday_wita TIMESTAMP;
BEGIN
  -- Конвертируем в WITA timezone (без timezone info)
  wita_time := ts AT TIME ZONE 'Asia/Makassar';
  
  -- Получаем день недели (1=Monday, 7=Sunday)
  day_of_week := EXTRACT(ISODOW FROM wita_time)::int;
  
  -- Находим понедельник этой недели в WITA
  monday_wita := DATE_TRUNC('day', wita_time) - make_interval(days => (day_of_week - 1));
  
  -- Конвертируем обратно в UTC (timestamptz)
  RETURN monday_wita AT TIME ZONE 'Asia/Makassar';
END $$;