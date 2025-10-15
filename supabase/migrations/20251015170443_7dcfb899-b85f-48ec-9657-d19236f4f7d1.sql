-- ЕДИНЫЙ ИСТОЧНИК ДЛЯ NEXT WEEK: дневной срез и агрегаты для карточек

-- 1) Базовая дневная вьюха (используется и таблицей, и карточками)
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

GRANT SELECT ON public.v_next_week_votes_by_day TO authenticated, anon;

-- 2) Агрегаты для карточек Next Week (единый источник правды)
CREATE OR REPLACE VIEW public.v_next_week_cards_totals AS
SELECT
  v.participant_user_id,
  v.candidate_name,
  SUM(v.likes) AS total_likes,
  SUM(v.dislikes) AS total_dislikes,
  SUM(v.total_votes) AS total_votes
FROM public.v_next_week_votes_by_day v
WHERE v.participant_user_id IN (
  SELECT user_id 
  FROM public.weekly_contest_participants 
  WHERE admin_status IN ('next week', 'next week on site')
    AND deleted_at IS NULL
)
GROUP BY v.participant_user_id, v.candidate_name;

GRANT SELECT ON public.v_next_week_cards_totals TO authenticated, anon;