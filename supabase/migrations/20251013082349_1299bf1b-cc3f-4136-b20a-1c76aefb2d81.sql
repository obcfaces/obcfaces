-- Parse week_interval and set correct week_start for past participants
-- Format: "DD/MM-DD/MM/YY" → extract first date as week_start

UPDATE public.weekly_contest_participants
SET week_start = TO_DATE(
  SPLIT_PART(week_interval, '-', 1) || '/' || RIGHT(week_interval, 2),
  'DD/MM/YY'
)
WHERE admin_status = 'past'
  AND week_interval IS NOT NULL
  AND is_active = true
  AND deleted_at IS NULL;