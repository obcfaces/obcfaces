
-- =====================================================
-- FIX 1: Правильный расчёт текущего понедельника UTC
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_current_monday_utc()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (date_trunc('week', (now() AT TIME ZONE 'UTC')))::date;
$$;

-- Проверка: должно вернуть 2025-10-13 (сегодняшний понедельник)
SELECT now() AT TIME ZONE 'UTC' AS now_utc, get_current_monday_utc() AS monday_utc;

-- =====================================================
-- FIX 2: Убираем дубль активной недели
-- =====================================================
-- Закрываем лишнюю активную неделю (05-11 октября)
UPDATE weekly_contests
SET status = 'closed', updated_at = now()
WHERE id = '3fe51ad1-9755-4c6d-a814-d2cfd8c3f726'
  AND status = 'active';

-- =====================================================
-- FIX 3: Защита от дублей - только одна активная неделя
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_week_contest
ON weekly_contests ((1)) WHERE status = 'active';

-- =====================================================
-- VERIFICATION: Проверяем что всё исправлено
-- =====================================================

-- Должна остаться только одна активная неделя (06-12 октября)
SELECT 'Active weeks check:' AS check_type, count(*) AS count
FROM weekly_contests
WHERE status = 'active';

-- Текущий понедельник должен быть 2025-10-13
SELECT 'Monday UTC check:' AS check_type, get_current_monday_utc() AS monday_utc;
