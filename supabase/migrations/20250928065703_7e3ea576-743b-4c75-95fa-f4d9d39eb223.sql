-- Create function to get next week daily voting stats  
CREATE OR REPLACE FUNCTION get_next_week_daily_stats()
RETURNS TABLE(
  day_of_week integer,
  day_name text,
  like_count bigint,
  dislike_count bigint,
  total_votes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH week_dates AS (
    SELECT 
      dow,
      CASE dow
        WHEN 1 THEN 'Mon'
        WHEN 2 THEN 'Tue' 
        WHEN 3 THEN 'Wed'
        WHEN 4 THEN 'Thu'
        WHEN 5 THEN 'Fri'
        WHEN 6 THEN 'Sat'
        WHEN 0 THEN 'Sun'
      END AS day_name
    FROM generate_series(0, 6) AS dow
  ),
  daily_votes AS (
    SELECT 
      EXTRACT(DOW FROM nwv.created_at) AS dow,
      SUM(CASE WHEN nwv.vote_type = 'like' THEN nwv.vote_count ELSE 0 END) as like_count,
      SUM(CASE WHEN nwv.vote_type = 'dislike' THEN nwv.vote_count ELSE 0 END) as dislike_count,
      SUM(nwv.vote_count) as total_votes
    FROM next_week_votes nwv
    WHERE nwv.created_at >= date_trunc('week', CURRENT_DATE)
      AND nwv.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
    GROUP BY EXTRACT(DOW FROM nwv.created_at)
  )
  
  SELECT 
    wd.dow as day_of_week,
    wd.day_name,
    COALESCE(dv.like_count, 0) as like_count,
    COALESCE(dv.dislike_count, 0) as dislike_count,
    COALESCE(dv.total_votes, 0) as total_votes
  FROM week_dates wd
  LEFT JOIN daily_votes dv ON wd.dow = dv.dow
  ORDER BY wd.dow;
END;
$function$;