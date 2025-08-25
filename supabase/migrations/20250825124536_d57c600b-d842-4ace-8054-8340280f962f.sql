-- Обновляем данные конкурса прошлой недели
-- Сначала установим правильные ранги участников
UPDATE weekly_contest_participants 
SET final_rank = 1 
WHERE contest_id = 'fc81b526-c732-43f2-9cc2-c46c696e5343' 
  AND user_id = '17286d26-15d0-45c9-b993-4146c4c3d4f9'  -- inna rip с рейтингом 5.0 и 4 голосами
  AND average_rating = 5.0 
  AND total_votes = 4;

-- Обновляем профиль победителя
UPDATE profiles 
SET participant_type = 'winner'
WHERE id = '17286d26-15d0-45c9-b993-4146c4c3d4f9';

-- Устанавливаем winner_id в конкурсе
UPDATE weekly_contests 
SET winner_id = '17286d26-15d0-45c9-b993-4146c4c3d4f9'
WHERE id = 'fc81b526-c732-43f2-9cc2-c46c696e5343';

-- Также закроем этот конкурс, так как он уже завершён
UPDATE weekly_contests 
SET status = 'closed'
WHERE id = 'fc81b526-c732-43f2-9cc2-c46c696e5343' 
  AND week_end_date < CURRENT_DATE;