-- Исправление: VIEW не создались из-за ошибок, пересоздаем

-- 1. display_name_generated - используем обычную колонку вместо GENERATED
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name_generated text;

-- Обновляем существующие записи
UPDATE profiles
SET display_name_generated = COALESCE(
  NULLIF(TRIM(display_name), ''),
  NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''),
  'Anonymous'
);

-- Триггер для автообновления
CREATE OR REPLACE FUNCTION update_display_name_generated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_name_generated := COALESCE(
    NULLIF(TRIM(NEW.display_name), ''),
    NULLIF(TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name)), ''),
    'Anonymous'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_display_name_generated ON profiles;
CREATE TRIGGER trg_update_display_name_generated
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_display_name_generated();

-- 2. Пересоздаем VIEW для next_week_votes с правильной логикой

-- Проверяем структуру next_week_votes
DO $$
BEGIN
  -- Добавляем participant_user_id если нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'next_week_votes' AND column_name = 'participant_user_id'
  ) THEN
    ALTER TABLE next_week_votes ADD COLUMN participant_user_id uuid;
  END IF;
END $$;

-- Бэкфилл participant_user_id из candidate_name
UPDATE next_week_votes nwv
SET participant_user_id = p.id
FROM profiles p
WHERE nwv.participant_user_id IS NULL
  AND TRIM(LOWER(nwv.candidate_name)) = TRIM(LOWER(p.display_name_generated));

-- Индекс для производительности
CREATE INDEX IF NOT EXISTS ix_next_week_votes_participant
  ON next_week_votes(participant_user_id, created_at);

-- VIEW для агрегированных голосов по дням
CREATE OR REPLACE VIEW v_next_week_votes_by_day AS
WITH vote_data AS (
  SELECT
    nwv.participant_user_id,
    nwv.user_id,
    COALESCE(p.display_name_generated, nwv.candidate_name) as candidate_name,
    DATE(nwv.created_at AT TIME ZONE 'UTC') as vote_date,
    nwv.vote_type,
    nwv.vote_count
  FROM next_week_votes nwv
  LEFT JOIN profiles p ON p.id = nwv.participant_user_id
  WHERE nwv.created_at >= date_trunc('week', now() AT TIME ZONE 'UTC')
)
SELECT
  participant_user_id,
  candidate_name,
  vote_date,
  COUNT(*) FILTER (WHERE vote_type = 'like') as likes,
  COUNT(*) FILTER (WHERE vote_type = 'dislike') as dislikes,
  COUNT(*) as total_votes
FROM vote_data
GROUP BY participant_user_id, candidate_name, vote_date
ORDER BY vote_date, total_votes DESC;

GRANT SELECT ON v_next_week_votes_by_day TO authenticated, anon;

-- VIEW для унифицированных contestant_ratings
CREATE OR REPLACE VIEW v_contestant_ratings_unified AS
SELECT
  cr.id,
  cr.user_id,
  cr.participant_id,
  cr.rating,
  cr.created_at,
  cr.updated_at,
  cr.week_interval,
  cr.week_start_utc,
  COALESCE(p.display_name_generated, cr.contestant_name) as contestant_name_unified
FROM contestant_ratings cr
LEFT JOIN profiles p ON p.id = (
  SELECT wcp.user_id 
  FROM weekly_contest_participants wcp 
  WHERE wcp.id = cr.participant_id
  LIMIT 1
);

GRANT SELECT ON v_contestant_ratings_unified TO authenticated, anon;

COMMENT ON VIEW v_next_week_votes_by_day IS 
  'Daily aggregated votes for next week participants. Always use this for reporting.';
COMMENT ON VIEW v_contestant_ratings_unified IS 
  'Unified contestant ratings with names from profiles.display_name_generated';