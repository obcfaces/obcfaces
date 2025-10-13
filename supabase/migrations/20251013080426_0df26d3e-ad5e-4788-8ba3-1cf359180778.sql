-- Add new columns for week intervals and winner tracking
ALTER TABLE public.weekly_contest_participants
  ADD COLUMN IF NOT EXISTS week_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preview_week_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_weekly_winner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nw_is_promoted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nw_score NUMERIC,
  ADD COLUMN IF NOT EXISTS nw_rank_segment INTEGER;

-- Add strict status validation
ALTER TABLE public.weekly_contest_participants
  DROP CONSTRAINT IF EXISTS participants_status_check;

ALTER TABLE public.weekly_contest_participants
  ADD CONSTRAINT participants_status_check
  CHECK (admin_status IN ('pending','rejected','pre next week','next week','this week','past'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_week_start ON public.weekly_contest_participants(week_start);
CREATE INDEX IF NOT EXISTS idx_participants_preview_week_start ON public.weekly_contest_participants(preview_week_start);
CREATE INDEX IF NOT EXISTS idx_participants_status_week ON public.weekly_contest_participants(admin_status, week_start);

-- 1) Close this week and determine winner
CREATE OR REPLACE FUNCTION public.sp_close_this_week(p_week_start TIMESTAMPTZ, p_prev_week_start TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _w_now TIMESTAMPTZ := p_week_start;
  _w_prev TIMESTAMPTZ := p_prev_week_start;
  _winner UUID;
BEGIN
  -- Find winner of previous week (highest average rating)
  SELECT id INTO _winner
  FROM public.weekly_contest_participants
  WHERE admin_status = 'this week'
    AND week_start = _w_prev
    AND is_active = true
    AND deleted_at IS NULL
  ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
  LIMIT 1;

  -- Mark winner
  IF _winner IS NOT NULL THEN
    UPDATE public.weekly_contest_participants
    SET is_weekly_winner = true
    WHERE id = _winner;
  END IF;

  -- Move all this_week(prev) -> past (week_start preserved)
  UPDATE public.weekly_contest_participants
  SET admin_status = 'past'
  WHERE admin_status = 'this week'
    AND week_start = _w_prev
    AND is_active = true
    AND deleted_at IS NULL;

  RETURN json_build_object('winner', _winner);
END;
$$;

-- 2) Promote next_week -> this_week
CREATE OR REPLACE FUNCTION public.sp_promote_next_to_this(p_week_start TIMESTAMPTZ)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  UPDATE public.weekly_contest_participants
  SET admin_status = 'this week',
      week_start = p_week_start
  WHERE admin_status = 'next week'
    AND preview_week_start = p_week_start
    AND is_active = true
    AND deleted_at IS NULL;
$$;

-- 3) Publish pre_next_week -> next_week
CREATE OR REPLACE FUNCTION public.sp_publish_pre_to_next(p_preview_week_start TIMESTAMPTZ)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  UPDATE public.weekly_contest_participants
  SET admin_status = 'next week',
      preview_week_start = p_preview_week_start,
      nw_is_promoted = false,
      nw_score = NULL,
      nw_rank_segment = NULL
  WHERE admin_status = 'pre next week'
    AND is_active = true
    AND deleted_at IS NULL;
$$;