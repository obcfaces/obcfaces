-- STAGE 2: Унификация, Оптимизация и Безопасность

-- 1. Индексы для скорости агрегаций
CREATE INDEX IF NOT EXISTS idx_next_week_votes_user_created
  ON next_week_votes (participant_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_next_week_votes_vote_date
  ON next_week_votes (created_at, vote_type);

CREATE INDEX IF NOT EXISTS idx_weekly_participants_status
  ON weekly_contest_participants (admin_status, deleted_at);

CREATE INDEX IF NOT EXISTS idx_weekly_participants_user_status
  ON weekly_contest_participants (user_id, admin_status, deleted_at);

-- 2. View с лидерами (топ-3 участницы)
CREATE OR REPLACE VIEW public.v_next_week_top3 AS
SELECT
  participant_user_id,
  candidate_name,
  total_likes,
  total_dislikes,
  total_votes,
  RANK() OVER (ORDER BY total_votes DESC, total_likes DESC) AS rank_position
FROM v_next_week_cards_totals
ORDER BY total_votes DESC, total_likes DESC
LIMIT 3;

GRANT SELECT ON v_next_week_top3 TO authenticated, anon;

-- 3. Оптимизация существующих views для использования индексов
CREATE OR REPLACE VIEW public.v_next_week_votes_by_day AS
WITH vote_data AS (
  SELECT
    nwv.participant_user_id,
    COALESCE(p.display_name_generated, nwv.candidate_name) AS candidate_name,
    DATE(nwv.created_at AT TIME ZONE 'UTC') AS vote_date,
    nwv.vote_type,
    COALESCE(nwv.vote_count, 1) AS vote_count
  FROM public.next_week_votes nwv
  LEFT JOIN public.profiles p ON p.id = nwv.participant_user_id
  WHERE nwv.created_at >= date_trunc('week', now() AT TIME ZONE 'UTC')
    AND nwv.participant_user_id IS NOT NULL
)
SELECT
  participant_user_id,
  candidate_name,
  vote_date,
  SUM(CASE WHEN vote_type = 'like' THEN vote_count ELSE 0 END) AS likes,
  SUM(CASE WHEN vote_type = 'dislike' THEN vote_count ELSE 0 END) AS dislikes,
  SUM(vote_count) AS total_votes
FROM vote_data
GROUP BY participant_user_id, candidate_name, vote_date;

-- 4. Публичный доступ на чтение агрегированных данных
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'next_week_votes' 
    AND policyname = 'Public can view vote statistics'
  ) THEN
    CREATE POLICY "Public can view vote statistics"
      ON next_week_votes
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 5. Документация
COMMENT ON VIEW v_next_week_top3 IS 'Top 3 participants by total votes for current week (UTC). Updates in real-time.';
COMMENT ON VIEW v_next_week_votes_by_day IS 'Daily vote statistics by participant for current week (UTC). Used by admin table and cards.';
COMMENT ON VIEW v_next_week_cards_totals IS 'Total vote counts by participant for current week (UTC). Used by participant cards.';