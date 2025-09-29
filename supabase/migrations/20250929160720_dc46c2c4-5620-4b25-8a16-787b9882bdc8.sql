-- Обновляем статус на "next week on site" для участниц с конкретным временем изменения статуса "past"
UPDATE weekly_contest_participants 
SET 
  admin_status = 'next week on site',
  status_history = jsonb_set(
    status_history,
    '{"next week on site"}',
    jsonb_build_object(
      'changed_at', now()::text,
      'contest_title', 'Contest 29 Sep-05 Oct 2025',
      'week_start_date', '2025-09-29',
      'week_end_date', '2025-10-05'
    )
  )
WHERE admin_status = 'past' 
  AND status_history->'past'->>'changed_at' = '2025-09-29T03:39:16.70688+00:00';