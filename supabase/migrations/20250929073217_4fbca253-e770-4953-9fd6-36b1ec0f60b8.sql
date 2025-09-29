-- Fix all incorrect week intervals in status_week_history 
-- Replace 2025 year with 2024 and ensure Monday-to-Sunday format

-- Update participants with this week status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{this week}',
    to_jsonb('23/09-29/09/24'::text)
)
WHERE admin_status = 'this week' 
AND (status_week_history->>'this week' IS NULL OR status_week_history->>'this week' LIKE '%/25');

-- Update participants with past status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past}',
    to_jsonb('23/09-29/09/24'::text)
)
WHERE admin_status = 'past' 
AND (status_week_history->>'past' IS NULL OR status_week_history->>'past' LIKE '%/25');

-- Update participants with past week 1 status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 1}',
    to_jsonb('23/09-29/09/24'::text)
)
WHERE admin_status = 'past week 1' 
AND (status_week_history->>'past week 1' IS NULL OR status_week_history->>'past week 1' LIKE '%/25');

-- Update participants with past week 2 status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{past week 2}',
    to_jsonb('16/09-22/09/24'::text)
)
WHERE admin_status = 'past week 2' 
AND (status_week_history->>'past week 2' IS NULL OR status_week_history->>'past week 2' LIKE '%/25');

-- Update participants with next week status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{next week}',
    to_jsonb('30/09-06/10/24'::text)
)
WHERE admin_status = 'next week' 
AND (status_week_history->>'next week' IS NULL OR status_week_history->>'next week' LIKE '%/25');

-- Update participants with next week on site status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{next week on site}',
    to_jsonb('30/09-06/10/24'::text)
)
WHERE admin_status = 'next week on site' 
AND (status_week_history->>'next week on site' IS NULL OR status_week_history->>'next week on site' LIKE '%/25');

-- Update pending status
UPDATE weekly_contest_participants 
SET status_week_history = jsonb_set(
    COALESCE(status_week_history, '{}'::jsonb),
    '{pending}',
    to_jsonb('23/09-29/09/24'::text)
)
WHERE admin_status = 'pending' 
AND (status_week_history->>'pending' IS NULL OR status_week_history->>'pending' LIKE '%/25');