-- ==========================================
-- Миграция: Удаление статуса next_week_on_site
-- ==========================================

-- 0) Создаем функцию для начала недели в WITA (Asia/Makassar)
CREATE OR REPLACE FUNCTION public.week_start_wita(ts timestamptz)
RETURNS timestamptz
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT date_trunc('week', ts AT TIME ZONE 'Asia/Makassar')
         AT TIME ZONE 'Asia/Makassar';
$$;

-- 1) Переводим все next_week_on_site → next_week
UPDATE public.weekly_contest_participants
SET admin_status = 'next week'
WHERE admin_status = 'next week on site';

-- 2) Добавляем CHECK constraint для защиты от повторного появления статуса
-- Сначала удаляем старый constraint если есть
ALTER TABLE public.weekly_contest_participants
  DROP CONSTRAINT IF EXISTS participants_status_check;

-- Добавляем новый constraint без next_week_on_site
ALTER TABLE public.weekly_contest_participants
  ADD CONSTRAINT participants_status_check
  CHECK (admin_status IN ('pending', 'rejected', 'pre next week', 'next week', 'this week', 'past'));