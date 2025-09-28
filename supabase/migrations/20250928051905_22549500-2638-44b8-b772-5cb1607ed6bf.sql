-- Fix incorrect weekly contest that starts on Sunday instead of Monday
UPDATE weekly_contests 
SET 
  week_start_date = '2025-09-22',
  week_end_date = '2025-09-28',
  title = 'Contest 22.09-28.09.2025'
WHERE week_start_date = '2025-09-28' 
  AND week_end_date = '2025-10-04'
  AND title = 'Contest 28 Sep-04 Oct 2025';

-- Update any participants linked to the incorrect contest week
UPDATE weekly_contest_participants 
SET status_history = jsonb_set(
  status_history,
  ARRAY[admin_status],
  jsonb_build_object(
    'changed_at', (status_history->admin_status->>'changed_at')::timestamp with time zone,
    'contest_title', 'Contest 22.09-28.09.2025',
    'week_start_date', '2025-09-22',
    'week_end_date', '2025-09-28'
  )
)
WHERE status_history->admin_status->>'week_start_date' = '2025-09-28';