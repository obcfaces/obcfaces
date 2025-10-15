-- ============================================================
-- P0: КРИТИЧЕСКИЕ ИСПРАВЛЕНИЯ
-- ============================================================

-- 1. ЗАЩИТА ОТ НАКРУТОК: Уникальность голосов
-- ============================================================

-- Добавляем вычисляемую колонку week_start_utc в next_week_votes
ALTER TABLE next_week_votes 
ADD COLUMN IF NOT EXISTS week_start_utc date
  GENERATED ALWAYS AS (date_trunc('week', created_at AT TIME ZONE 'UTC')::date) STORED;

-- Уникальный индекс: один голос типа на кандидата от пользователя за неделю
CREATE UNIQUE INDEX IF NOT EXISTS uq_next_week_vote_user_week_candidate_type
  ON next_week_votes(user_id, week_start_utc, candidate_name, vote_type);

-- То же для contestant_ratings
ALTER TABLE contestant_ratings
ADD COLUMN IF NOT EXISTS week_start_utc date
  GENERATED ALWAYS AS (date_trunc('week', created_at AT TIME ZONE 'UTC')::date) STORED;

-- Один рейтинг от пользователя на участника за неделю
CREATE UNIQUE INDEX IF NOT EXISTS uq_rating_user_week_participant
  ON contestant_ratings(user_id, week_start_utc, participant_id)
  WHERE participant_id IS NOT NULL;

-- 2. ПРОСТАВЛЕНИЕ ПОБЕДИТЕЛЕЙ: Флаги для промо
-- ============================================================

ALTER TABLE weekly_contest_participants
ADD COLUMN IF NOT EXISTS selected_for_promotion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS promote_on_week date;

COMMENT ON COLUMN weekly_contest_participants.selected_for_promotion IS 
  'Flag to mark card for promotion to next status';
COMMENT ON COLUMN weekly_contest_participants.promote_on_week IS 
  'Target week (Monday UTC) when this card should be promoted';

-- Индекс для эффективного отбора карточек на промо
CREATE INDEX IF NOT EXISTS ix_participants_promotion
  ON weekly_contest_participants(promote_on_week, selected_for_promotion)
  WHERE selected_for_promotion = true;

-- 3. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ (P1)
-- ============================================================

-- Голоса по неделям
CREATE INDEX IF NOT EXISTS ix_next_week_votes_week
  ON next_week_votes(week_start_utc, candidate_name);

CREATE INDEX IF NOT EXISTS ix_ratings_week
  ON contestant_ratings(week_start_utc, participant_id);

-- Статусы участников
CREATE INDEX IF NOT EXISTS ix_participants_status
  ON weekly_contest_participants(admin_status, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_participants_week_start
  ON weekly_contest_participants(week_start)
  WHERE is_active = true AND deleted_at IS NULL;

-- 4. WILSON SCORE ДЛЯ ЧЕСТНОГО РЕЙТИНГА (P1)
-- ============================================================

CREATE OR REPLACE FUNCTION public.wilson_score_lower_bound(
  positive_votes bigint,
  total_votes bigint,
  confidence numeric DEFAULT 0.95
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  z numeric;
  phat numeric;
BEGIN
  -- Защита от деления на ноль
  IF total_votes = 0 THEN
    RETURN 0;
  END IF;
  
  -- z-score для 95% доверительного интервала
  z := 1.96; -- для confidence = 0.95
  
  -- Доля положительных голосов
  phat := positive_votes::numeric / total_votes::numeric;
  
  -- Wilson score lower bound
  RETURN (
    phat + z*z/(2*total_votes) - z * sqrt((phat*(1-phat)+z*z/(4*total_votes))/total_votes)
  ) / (1 + z*z/total_votes);
END;
$$;

COMMENT ON FUNCTION public.wilson_score_lower_bound IS 
  'Calculate Wilson score lower bound for rating confidence. Higher score = more reliable high rating.';

-- Функция для расчета Wilson score по участнику
CREATE OR REPLACE FUNCTION public.get_participant_wilson_score(
  participant_id_param uuid,
  min_votes integer DEFAULT 5
)
RETURNS TABLE(
  participant_id uuid,
  positive_votes bigint,
  total_votes bigint,
  wilson_score numeric,
  meets_threshold boolean
)
LANGUAGE sql
STABLE
AS $$
  WITH vote_stats AS (
    SELECT
      participant_id,
      COUNT(*) FILTER (WHERE rating >= 4) as positive_votes,
      COUNT(*) as total_votes
    FROM contestant_ratings
    WHERE participant_id = participant_id_param
    GROUP BY participant_id
  )
  SELECT
    vs.participant_id,
    vs.positive_votes,
    vs.total_votes,
    wilson_score_lower_bound(vs.positive_votes, vs.total_votes) as wilson_score,
    vs.total_votes >= min_votes as meets_threshold
  FROM vote_stats vs;
$$;

-- 5. RLS ПОЛИТИКИ: Проверка и усиление
-- ============================================================

-- Проверяем, что RLS включен
DO $$
BEGIN
  -- Включаем RLS для критичных таблиц, если еще не включен
  ALTER TABLE weekly_contest_participants ENABLE ROW LEVEL SECURITY;
  ALTER TABLE next_week_votes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contestant_ratings ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- Политика для next_week_votes: запрет UPDATE/DELETE
DROP POLICY IF EXISTS "No updates to votes" ON next_week_votes;
CREATE POLICY "No updates to votes" ON next_week_votes
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "No deletes to votes" ON next_week_votes;
CREATE POLICY "No deletes to votes" ON next_week_votes
  FOR DELETE
  USING (false);

-- Политика для contestant_ratings: запрет удаления
DROP POLICY IF EXISTS "Users cannot delete ratings" ON contestant_ratings;
CREATE POLICY "Users cannot delete ratings" ON contestant_ratings
  FOR DELETE
  USING (false);

-- 6. ИДЕМПОТЕНТНАЯ ФУНКЦИЯ ПЕРЕХОДА НЕДЕЛИ
-- ============================================================

CREATE OR REPLACE FUNCTION public.transition_weekly_contest_safe(
  target_week_start_utc date,
  dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_end_date date;
  week_interval_str text;
  transition_counts jsonb;
  this_to_past_count int := 0;
  next_to_this_count int := 0;
  pre_to_next_count int := 0;
BEGIN
  -- Validate: target_week_start must be a Monday
  IF EXTRACT(ISODOW FROM target_week_start_utc) != 1 THEN
    RAISE EXCEPTION 'target_week_start_utc must be a Monday (UTC)';
  END IF;
  
  week_end_date := target_week_start_utc + INTERVAL '6 days';
  week_interval_str := TO_CHAR(target_week_start_utc, 'DD/MM') || '-' || 
                       TO_CHAR(week_end_date, 'DD/MM/YY');
  
  -- Check if already transitioned
  IF EXISTS (
    SELECT 1 FROM weekly_contest_participants
    WHERE week_interval = week_interval_str
      AND admin_status = 'this week'
    LIMIT 1
  ) THEN
    RETURN jsonb_build_object(
      'status', 'already_completed',
      'week_start', target_week_start_utc,
      'week_interval', week_interval_str,
      'message', 'Transition already completed for this week'
    );
  END IF;
  
  IF dry_run THEN
    -- DRY RUN: только подсчет
    SELECT COUNT(*) INTO this_to_past_count
    FROM weekly_contest_participants
    WHERE admin_status = 'this week' 
      AND is_active = true 
      AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO next_to_this_count
    FROM weekly_contest_participants
    WHERE selected_for_promotion = true
      AND promote_on_week = target_week_start_utc
      AND admin_status = 'next week on site'
      AND is_active = true
      AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO pre_to_next_count
    FROM weekly_contest_participants
    WHERE admin_status = 'pre next week'
      AND is_active = true
      AND deleted_at IS NULL;
    
    RETURN jsonb_build_object(
      'status', 'dry_run',
      'week_start', target_week_start_utc,
      'week_interval', week_interval_str,
      'transitions', jsonb_build_object(
        'thisWeekToPast', this_to_past_count,
        'nextWeekToThis', next_to_this_count,
        'preNextWeekToNext', pre_to_next_count
      )
    );
  END IF;
  
  -- REAL EXECUTION: atomic transaction
  
  -- 1. This week → Past
  UPDATE weekly_contest_participants
  SET 
    admin_status = 'past',
    week_interval = week_interval_str
  WHERE admin_status = 'this week'
    AND is_active = true
    AND deleted_at IS NULL;
  GET DIAGNOSTICS this_to_past_count = ROW_COUNT;
  
  -- 2. Next week (selected) → This week
  UPDATE weekly_contest_participants
  SET 
    admin_status = 'this week',
    week_interval = week_interval_str,
    week_start = target_week_start_utc,
    selected_for_promotion = false
  WHERE selected_for_promotion = true
    AND promote_on_week = target_week_start_utc
    AND admin_status = 'next week on site'
    AND is_active = true
    AND deleted_at IS NULL;
  GET DIAGNOSTICS next_to_this_count = ROW_COUNT;
  
  -- 3. Pre-next → Next
  UPDATE weekly_contest_participants
  SET 
    admin_status = 'next week on site',
    week_interval = week_interval_str
  WHERE admin_status = 'pre next week'
    AND is_active = true
    AND deleted_at IS NULL;
  GET DIAGNOSTICS pre_to_next_count = ROW_COUNT;
  
  -- Build response
  transition_counts := jsonb_build_object(
    'thisWeekToPast', this_to_past_count,
    'nextWeekToThis', next_to_this_count,
    'preNextWeekToNext', pre_to_next_count
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'week_start', target_week_start_utc,
    'week_interval', week_interval_str,
    'transitions', transition_counts,
    'message', 'Weekly contest transition completed successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.transition_weekly_contest_safe IS 
  'Idempotent weekly transition: This→Past, selected Next→This, Pre→Next. Uses promote_on_week for safety.';

-- Создаем удобную обертку для текущей недели
CREATE OR REPLACE FUNCTION public.transition_this_week(dry_run boolean DEFAULT false)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT transition_weekly_contest_safe(
    date_trunc('week', now() AT TIME ZONE 'UTC')::date,
    dry_run
  );
$$;