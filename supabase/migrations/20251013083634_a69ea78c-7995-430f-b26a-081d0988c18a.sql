-- Пересоздать week_start_wita с правильным расчетом понедельника (ISO 8601)
CREATE OR REPLACE FUNCTION public.week_start_wita(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
SET search_path = public
AS $$
  -- ISO week starts on Monday (1=Monday, 7=Sunday)
  -- Convert to WITA (Asia/Makassar), get day of week, subtract to Monday
  SELECT (
    DATE_TRUNC('day', ts AT TIME ZONE 'Asia/Makassar') 
    - make_interval(days => (EXTRACT(ISODOW FROM ts AT TIME ZONE 'Asia/Makassar')::int - 1))
  ) AT TIME ZONE 'Asia/Makassar';
$$;

-- Пересоздать views с исправленной функцией
CREATE OR REPLACE VIEW public.v_this_week AS
SELECT *
FROM public.weekly_contest_participants
WHERE admin_status = 'this week'
  AND week_start = public.week_start_wita(now());

CREATE OR REPLACE VIEW public.v_next_week AS
SELECT *
FROM public.weekly_contest_participants
WHERE admin_status = 'next week'
  AND preview_week_start = public.week_start_wita(now());

CREATE OR REPLACE VIEW public.v_past_archive AS
SELECT
  p.*,
  FLOOR(EXTRACT(EPOCH FROM (public.week_start_wita(now()) - p.week_start)) / (7*24*3600))::int AS week_index
FROM public.weekly_contest_participants p
WHERE p.admin_status = 'past';