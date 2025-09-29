-- Вернем обратно всех участниц с contest period 22.09-28.09.2025 к статусу past
-- чтобы найти только тех кого действительно нужно обновить
UPDATE weekly_contest_participants 
SET admin_status = 'past'
WHERE admin_status = 'next week on site'
  AND status_history->'past'->>'contest_title' = 'Contest 22.09-28.09.2025';