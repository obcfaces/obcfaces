-- Обновляем статус на "next week on site" только для участниц созданных 23 сентября
-- с contest period 22.09-28.09.2025
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
  AND status_history->'past'->>'contest_title' = 'Contest 22.09-28.09.2025'
  AND created_at >= '2025-09-23 00:00:00'::timestamp
  AND created_at < '2025-09-24 00:00:00'::timestamp;