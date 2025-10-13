-- Откатываем sp_close_this_week на старую метрику (average_rating + total_votes)
CREATE OR REPLACE FUNCTION public.sp_close_this_week(p_week_start TIMESTAMPTZ, p_prev_week_start TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _w_now  TIMESTAMPTZ := p_week_start;
  _w_prev TIMESTAMPTZ := p_prev_week_start;
  _winner UUID;
BEGIN
  -- Выбор победителя по СТАРОЙ метрике (average_rating + total_votes)
  WITH ranked AS (
    SELECT
      id,
      average_rating,
      total_votes,
      ROW_NUMBER() OVER (
        ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST, id
      ) AS rn
    FROM public.weekly_contest_participants
    WHERE admin_status = 'this week'
      AND week_start = _w_prev
      AND is_active = true
      AND deleted_at IS NULL
  )
  SELECT id INTO _winner FROM ranked WHERE rn = 1;

  -- Пометить победителя
  IF _winner IS NOT NULL THEN
    UPDATE public.weekly_contest_participants
    SET is_weekly_winner = true
    WHERE id = _winner;
  END IF;

  -- Зафиксировать снимок недели (final_rank_in_week по старой метрике)
  UPDATE public.weekly_contest_participants p
  SET final_rank_in_week = r.rn,
      final_total_votes = r.total_votes
  FROM (
    SELECT
      id,
      total_votes,
      ROW_NUMBER() OVER (
        ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST, id
      ) AS rn
    FROM public.weekly_contest_participants
    WHERE admin_status = 'this week'
      AND week_start = _w_prev
      AND is_active = true
      AND deleted_at IS NULL
  ) r
  WHERE p.id = r.id;

  -- Перевести всех this week (prev) -> past (week_start сохраняем)
  UPDATE public.weekly_contest_participants
  SET admin_status = 'past'
  WHERE admin_status = 'this week'
    AND week_start = _w_prev
    AND is_active = true
    AND deleted_at IS NULL;

  RETURN json_build_object('winner', _winner);
END;
$$;

COMMENT ON FUNCTION public.sp_close_this_week IS 'Закрывает this week блок, выбирая победителя по average_rating + total_votes';