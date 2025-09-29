-- Исправляем все интервалы в базе данных на правильные 2025 года
UPDATE weekly_contest_participants 
SET week_interval = CASE admin_status
  WHEN 'this week' THEN '29/09-05/10/25'
  WHEN 'next week' THEN '06/10-12/10/25'
  WHEN 'next week on site' THEN '06/10-12/10/25'
  WHEN 'pre next week' THEN '06/10-12/10/25'
  WHEN 'past week 1' THEN '22/09-28/09/25'
  WHEN 'past' THEN '22/09-28/09/25'
  WHEN 'past week 2' THEN '15/09-21/09/25'
  WHEN 'past week 3' THEN '08/09-14/09/25'
  WHEN 'past week 4' THEN '01/09-07/09/25'
  WHEN 'week-2025-09-23' THEN '22/09-28/09/25'  -- Исправляем этот странный статус
  WHEN 'pending' THEN '29/09-05/10/25'
  ELSE '29/09-05/10/25'
END
WHERE is_active = true;

-- Также исправляем странный статус на правильный
UPDATE weekly_contest_participants 
SET admin_status = 'past'
WHERE admin_status = 'week-2025-09-23' AND is_active = true;