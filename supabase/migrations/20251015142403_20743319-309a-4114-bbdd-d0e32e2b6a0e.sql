-- Create function to get next week daily voting stats PER PARTICIPANT
CREATE OR REPLACE FUNCTION get_next_week_daily_stats_by_participant()
RETURNS TABLE(
  candidate_name text,
  day_of_week integer,
  day_name text,
  like_count bigint,
  dislike_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  week_monday TIMESTAMP WITH TIME ZONE;
  week_sunday TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate current week boundaries (Monday to Sunday) in UTC
  week_monday := date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '1 day';
  week_sunday := week_monday + interval '6 days' + interval '23 hours 59 minutes 59 seconds';

  RETURN QUERY
  SELECT 
    nwv.candidate_name,
    EXTRACT(DOW FROM nwv.created_at AT TIME ZONE 'UTC')::integer AS day_of_week,
    CASE EXTRACT(DOW FROM nwv.created_at AT TIME ZONE 'UTC')::integer
      WHEN 0 THEN 'Sun'
      WHEN 1 THEN 'Mon'
      WHEN 2 THEN 'Tue'
      WHEN 3 THEN 'Wed'
      WHEN 4 THEN 'Thu'
      WHEN 5 THEN 'Fri'
      WHEN 6 THEN 'Sat'
    END AS day_name,
    SUM(CASE WHEN nwv.vote_type = 'like' THEN 1 ELSE 0 END)::bigint AS like_count,
    SUM(CASE WHEN nwv.vote_type = 'dislike' THEN 1 ELSE 0 END)::bigint AS dislike_count
  FROM next_week_votes nwv
  WHERE nwv.created_at >= week_monday 
    AND nwv.created_at <= week_sunday
  GROUP BY nwv.candidate_name, EXTRACT(DOW FROM nwv.created_at AT TIME ZONE 'UTC')
  ORDER BY nwv.candidate_name, day_of_week;
END;
$$;