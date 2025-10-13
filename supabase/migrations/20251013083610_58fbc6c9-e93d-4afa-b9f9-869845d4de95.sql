-- ============================================
-- 1) ЗАЩИТНЫЕ ОГРАНИЧЕНИЯ
-- ============================================

-- this week/past обязаны иметь week_start; next week — preview_week_start
ALTER TABLE public.weekly_contest_participants
  DROP CONSTRAINT IF EXISTS participants_week_required,
  ADD CONSTRAINT participants_week_required
  CHECK (
    (admin_status IN ('this week','past') AND week_start IS NOT NULL)
    OR (admin_status IN ('pending','rejected','pre next week','next week'))
  );

ALTER TABLE public.weekly_contest_participants
  DROP CONSTRAINT IF EXISTS participants_preview_required,
  ADD CONSTRAINT participants_preview_required
  CHECK (
    (admin_status = 'next week' AND preview_week_start IS NOT NULL)
    OR (admin_status <> 'next week')
  );

-- Запрет менять week_start задним числом у this week/past
CREATE OR REPLACE FUNCTION public.trg_lock_week_start()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (OLD.admin_status IN ('this week','past'))
     AND OLD.week_start IS NOT NULL
     AND NEW.week_start IS DISTINCT FROM OLD.week_start THEN
    RAISE EXCEPTION 'week_start is immutable for statuses this week/past';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS t_lock_week_start ON public.weekly_contest_participants;
CREATE TRIGGER t_lock_week_start
BEFORE UPDATE ON public.weekly_contest_participants
FOR EACH ROW EXECUTE FUNCTION public.trg_lock_week_start();

-- ============================================
-- 2) ИДЕМПОТЕНТНОСТЬ РОЛЛОВЕРА
-- ============================================

CREATE TABLE IF NOT EXISTS public.weekly_jobs (
  week_start TIMESTAMPTZ PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3) ПРЕДСТАВЛЕНИЯ ДЛЯ ФРОНТА
-- ============================================

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

-- Архив с вычисленным индексом недели (0=this, 1.., >=7)
CREATE OR REPLACE VIEW public.v_past_archive AS
SELECT
  p.*,
  FLOOR(EXTRACT(EPOCH FROM (public.week_start_wita(now()) - p.week_start)) / (7*24*3600))::int AS week_index
FROM public.weekly_contest_participants p
WHERE p.admin_status = 'past';