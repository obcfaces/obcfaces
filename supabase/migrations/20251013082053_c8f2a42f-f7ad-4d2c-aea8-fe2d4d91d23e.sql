-- Fix week_start_wita to use MONDAY as week start (ISO 8601)
CREATE OR REPLACE FUNCTION public.week_start_wita(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  -- ISO week starts on Monday (1=Monday, 7=Sunday)
  -- Get the date in WITA timezone, subtract days to reach Monday
  SELECT (
    DATE_TRUNC('day', ts AT TIME ZONE 'Asia/Makassar') 
    - make_interval(days => (EXTRACT(ISODOW FROM ts AT TIME ZONE 'Asia/Makassar')::int - 1))
  ) AT TIME ZONE 'Asia/Makassar';
$$;

-- Recalculate week_start for 'this week' participants (should be 2025-10-13 = Monday)
UPDATE public.weekly_contest_participants
SET week_start = public.week_start_wita(now())
WHERE admin_status = 'this week'
  AND is_active = true
  AND deleted_at IS NULL;

-- Recalculate week_start for 'past' participants (should be 2025-10-06 = previous Monday)
UPDATE public.weekly_contest_participants
SET week_start = public.week_start_wita(now() - interval '1 week')
WHERE admin_status = 'past'
  AND is_active = true
  AND deleted_at IS NULL;

-- Recalculate preview_week_start for 'next week' participants (should be 2025-10-13)
UPDATE public.weekly_contest_participants
SET preview_week_start = public.week_start_wita(now())
WHERE admin_status = 'next week'
  AND is_active = true
  AND deleted_at IS NULL;