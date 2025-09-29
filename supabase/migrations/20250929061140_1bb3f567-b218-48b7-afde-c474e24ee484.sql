-- Обновляем период в статусе "past" для участниц с "past week 1" периодом 15.09-21.09.2025
UPDATE weekly_contest_participants 
SET status_history = jsonb_set(
  status_history,
  '{past}',
  jsonb_build_object(
    'changed_at', (status_history->'past'->>'changed_at'),
    'contest_title', 'Contest 22.09-28.09.2025',
    'week_end_date', '2025-09-28',
    'week_start_date', '2025-09-22'
  )
)
WHERE 
  status_history->'past week 1'->>'week_start_date' = '2025-09-15' 
  AND status_history->'past week 1'->>'week_end_date' = '2025-09-21'
  AND status_history ? 'past';