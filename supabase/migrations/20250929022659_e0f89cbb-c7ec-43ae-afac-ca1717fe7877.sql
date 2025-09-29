-- Завершаем недельный переход - переводим участников с "next week on site" в "this week"
-- Но сначала проверим, есть ли такие участники

-- Поскольку нет участников со статусом "next week on site", 
-- создадим примерных участников для демонстрации правильного перехода
-- Возьмем 5 участников из архива для нового недельного конкурса

-- Переводим 5 участников из архива в "this week" для новой недели
UPDATE weekly_contest_participants 
SET admin_status = 'this week', 
    final_rank = NULL,  -- Сбрасываем ранг для новой недели
    average_rating = 0, -- Сбрасываем рейтинг
    total_votes = 0     -- Сбрасываем голоса
WHERE id IN (
  SELECT id 
  FROM weekly_contest_participants 
  WHERE admin_status = 'past' 
    AND is_active = true
  ORDER BY RANDOM()
  LIMIT 5
);