-- STAGE 3: Personal Rankings and User Experience

-- View для личного рейтинга пользователя
CREATE OR REPLACE VIEW public.v_user_weekly_rank AS
SELECT
  v.participant_user_id,
  p.display_name_generated,
  SUM(v.total_votes) AS total_votes,
  RANK() OVER (ORDER BY SUM(v.total_votes) DESC) AS rank_position
FROM v_next_week_votes_by_day v
LEFT JOIN profiles p ON p.id = v.participant_user_id
WHERE v.vote_date >= date_trunc('week', now() AT TIME ZONE 'UTC')
  AND v.participant_user_id IS NOT NULL
GROUP BY v.participant_user_id, p.display_name_generated;

GRANT SELECT ON v_user_weekly_rank TO authenticated, anon;

-- Enable realtime for next_week_votes table
ALTER PUBLICATION supabase_realtime ADD TABLE next_week_votes;

-- Комментарий для документации
COMMENT ON VIEW v_user_weekly_rank IS 'Personal weekly ranking for each participant. Shows rank position and total votes for current week (UTC).';