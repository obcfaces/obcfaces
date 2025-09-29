-- Удаляем оставшиеся записи с неправильными статусами
DELETE FROM weekly_contest_participants 
WHERE admin_status LIKE 'week-2025%' AND is_active = true;

-- Проверяем что нет других странных статусов
SELECT DISTINCT admin_status, COUNT(*) as count
FROM weekly_contest_participants 
WHERE is_active = true
  AND admin_status NOT IN ('this week', 'next week', 'next week on site', 'pre next week', 'past', 'past week 1', 'past week 2', 'past week 3', 'past week 4', 'pending')
GROUP BY admin_status;