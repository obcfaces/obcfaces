-- ============================================================
-- ИСПРАВЛЕНИЕ ОСТАВШИХСЯ ПРОБЛЕМ
-- ============================================================

-- 1. БЭКФИЛЛ participant_user_id в next_week_votes
-- ============================================================

-- Сначала попробуем точное совпадение
UPDATE next_week_votes nwv
SET participant_user_id = p.id
FROM profiles p
WHERE nwv.participant_user_id IS NULL
  AND TRIM(LOWER(nwv.candidate_name)) = TRIM(LOWER(p.display_name_generated));

-- Затем попробуем совпадение по first_name + last_name
UPDATE next_week_votes nwv
SET participant_user_id = p.id
FROM profiles p
WHERE nwv.participant_user_id IS NULL
  AND TRIM(LOWER(nwv.candidate_name)) = TRIM(LOWER(CONCAT(p.first_name, ' ', p.last_name)));

-- Логируем неподключенные записи для ручной проверки
DO $$
DECLARE
  unmatched_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmatched_count
  FROM next_week_votes
  WHERE participant_user_id IS NULL;
  
  IF unmatched_count > 0 THEN
    RAISE NOTICE '⚠️  Unmatched votes: % records without participant_user_id', unmatched_count;
    RAISE NOTICE 'Run this query to see them: SELECT DISTINCT candidate_name FROM next_week_votes WHERE participant_user_id IS NULL;';
  ELSE
    RAISE NOTICE '✅ All next_week_votes records have participant_user_id';
  END IF;
END $$;

-- 2. ТРИГГЕРЫ ДЛЯ ЗАПРЕТА ИЗМЕНЕНИЯ УСТАРЕВШИХ ПОЛЕЙ
-- ============================================================

-- Функция для запрета изменения contestant_name в contestant_ratings
CREATE OR REPLACE FUNCTION forbid_legacy_contestant_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Разрешаем INSERT (для обратной совместимости)
  IF TG_OP = 'INSERT' THEN
    IF NEW.contestant_name IS NOT NULL THEN
      RAISE WARNING 'contestant_name is DEPRECATED. Use participant_id and join profiles for name.';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Запрещаем UPDATE contestant_name
  IF TG_OP = 'UPDATE' AND OLD.contestant_name IS DISTINCT FROM NEW.contestant_name THEN
    RAISE EXCEPTION 'contestant_name is DEPRECATED and cannot be updated. Use participant_id instead.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forbid_legacy_contestant_name ON contestant_ratings;
CREATE TRIGGER trg_forbid_legacy_contestant_name
  BEFORE INSERT OR UPDATE OF contestant_name ON contestant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION forbid_legacy_contestant_name();

-- Функция для запрета изменения candidate_name в next_week_votes
CREATE OR REPLACE FUNCTION forbid_legacy_candidate_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Разрешаем INSERT (для обратной совместимости)
  IF TG_OP = 'INSERT' THEN
    IF NEW.candidate_name IS NOT NULL AND NEW.participant_user_id IS NULL THEN
      RAISE WARNING 'candidate_name is DEPRECATED. Set participant_user_id instead.';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Запрещаем UPDATE candidate_name
  IF TG_OP = 'UPDATE' AND OLD.candidate_name IS DISTINCT FROM NEW.candidate_name THEN
    RAISE EXCEPTION 'candidate_name is DEPRECATED and cannot be updated. Use participant_user_id instead.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forbid_legacy_candidate_name ON next_week_votes;
CREATE TRIGGER trg_forbid_legacy_candidate_name
  BEFORE INSERT OR UPDATE OF candidate_name ON next_week_votes
  FOR EACH ROW
  EXECUTE FUNCTION forbid_legacy_candidate_name();

-- 3. АВТОЗАПОЛНЕНИЕ candidate_name из participant_user_id (для обратной совместимости)
-- ============================================================

CREATE OR REPLACE FUNCTION auto_fill_candidate_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Если participant_user_id задан, а candidate_name пуст - заполняем
  IF NEW.participant_user_id IS NOT NULL AND (NEW.candidate_name IS NULL OR NEW.candidate_name = '') THEN
    SELECT display_name_generated INTO NEW.candidate_name
    FROM profiles
    WHERE id = NEW.participant_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_fill_candidate_name ON next_week_votes;
CREATE TRIGGER trg_auto_fill_candidate_name
  BEFORE INSERT OR UPDATE ON next_week_votes
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_candidate_name();

-- 4. ФУНКЦИЯ ДЛЯ РУЧНОГО БЭКФИЛЛА (если нужно)
-- ============================================================

CREATE OR REPLACE FUNCTION backfill_participant_user_id(
  old_candidate_name text,
  correct_user_id uuid
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE next_week_votes
  SET participant_user_id = correct_user_id
  WHERE TRIM(LOWER(candidate_name)) = TRIM(LOWER(old_candidate_name))
    AND participant_user_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % records for candidate "%"', updated_count, old_candidate_name;
  
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION backfill_participant_user_id IS 
  'Manual backfill for next_week_votes.participant_user_id when name matching fails. Usage: SELECT backfill_participant_user_id(''Name'', ''uuid'');';

-- 5. ПРОВЕРОЧНЫЙ ОТЧЕТ
-- ============================================================

-- VIEW для проверки несовпадений
CREATE OR REPLACE VIEW v_unmatched_votes AS
SELECT 
  DISTINCT candidate_name,
  COUNT(*) as vote_count,
  MIN(created_at) as first_vote,
  MAX(created_at) as last_vote
FROM next_week_votes
WHERE participant_user_id IS NULL
GROUP BY candidate_name
ORDER BY vote_count DESC;

GRANT SELECT ON v_unmatched_votes TO authenticated;

COMMENT ON VIEW v_unmatched_votes IS 
  'Shows next_week_votes records that could not be matched to profiles. Needs manual backfill.';