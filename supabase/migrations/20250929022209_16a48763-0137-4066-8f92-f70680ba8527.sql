-- Исправляем статусы - возвращаем 5 лучших участников в "this week"
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE id IN (
  SELECT id FROM weekly_contest_participants 
  WHERE admin_status = 'past week 3' AND is_active = true
  ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
  LIMIT 5
);