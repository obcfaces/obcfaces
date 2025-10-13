-- Временно отключить триггер для миграции данных
ALTER TABLE public.weekly_contest_participants DISABLE TRIGGER t_lock_week_start;

-- Пересчитать week_start для всех past карточек на основе week_interval
UPDATE public.weekly_contest_participants
SET week_start = TO_TIMESTAMP(
  SPLIT_PART(week_interval, '-', 1) || '/' || '20' || RIGHT(week_interval, 2) || ' 00:00:00',
  'DD/MM/YYYY HH24:MI:SS'
) AT TIME ZONE 'Asia/Makassar'
WHERE admin_status = 'past'
  AND week_interval IS NOT NULL
  AND is_active = true
  AND deleted_at IS NULL;

-- Включить триггер обратно
ALTER TABLE public.weekly_contest_participants ENABLE TRIGGER t_lock_week_start;