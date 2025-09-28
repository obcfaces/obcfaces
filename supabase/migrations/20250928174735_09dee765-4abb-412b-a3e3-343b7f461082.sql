-- Еженедельный переход для новой недели 29 сентября - 5 октября 2025

-- 1. Закрыть все активные конкурсы
UPDATE weekly_contests 
SET status = 'closed', updated_at = NOW()
WHERE status = 'active';

-- 2. Создать новый конкурс для текущей недели (29 сентября - 5 октября)
INSERT INTO weekly_contests (week_start_date, week_end_date, title, status)
VALUES ('2025-09-29', '2025-10-05', 'Contest 29 Sep-05 Oct 2025', 'active');

-- 3. Определить победителя предыдущей недели и обновить ранги
WITH previous_week_participants AS (
  SELECT 
    wcp.id,
    wcp.user_id,
    wcp.average_rating,
    wcp.total_votes,
    ROW_NUMBER() OVER (ORDER BY wcp.average_rating DESC, wcp.total_votes DESC) as new_rank
  FROM weekly_contest_participants wcp
  WHERE wcp.admin_status = 'this week'
    AND wcp.is_active = true
)
UPDATE weekly_contest_participants wcp
SET final_rank = pwp.new_rank
FROM previous_week_participants pwp
WHERE wcp.id = pwp.id;

-- 4. Переместить участников по статусам
UPDATE weekly_contest_participants 
SET admin_status = 'past week 2'
WHERE admin_status = 'past week 1';

UPDATE weekly_contest_participants 
SET admin_status = 'past week 1'
WHERE admin_status = 'this week';

UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'next week on site';

UPDATE weekly_contest_participants 
SET admin_status = 'next week on site'
WHERE admin_status = 'next week';