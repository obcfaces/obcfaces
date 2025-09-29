-- Перемещаем Jasmin Carriaga как победительницу в блок "past week 1" (1 week ago)
-- Она должна быть там как победительница прошлой недели с final_rank = 1

UPDATE weekly_contest_participants 
SET admin_status = 'past week 1',
    final_rank = 1  -- Устанавливаем как победительницу
WHERE id = 'f1f75987-5d25-4405-a08f-807cbda387c1';

-- Также переместим других участников, которые были с ней в том же конкурсе
-- Они должны быть в блоке "past week 1" тоже
UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE admin_status = 'past week 2' 
  AND is_active = true
  AND final_rank IS NOT NULL  -- Только те, у кого есть ранг (финалисты того же конкурса)
  AND id != 'f1f75987-5d25-4405-a08f-807cbda387c1';  -- Исключаем Jasmin, её уже обновили