-- Create function to get daily voting statistics for the current week
CREATE OR REPLACE FUNCTION get_daily_voting_stats()
RETURNS TABLE (
  day_of_week integer,
  day_name text,
  vote_count bigint,
  like_count bigint
) AS $$
BEGIN
  -- Get current week's Monday
  WITH week_dates AS (
    SELECT 
      date_trunc('week', CURRENT_DATE)::date + (generate_series(0, 6) || ' days')::interval AS day_date,
      generate_series(0, 6) AS day_num,
      CASE generate_series(0, 6)
        WHEN 0 THEN 'Mon'
        WHEN 1 THEN 'Tue' 
        WHEN 2 THEN 'Wed'
        WHEN 3 THEN 'Thu'
        WHEN 4 THEN 'Fri'
        WHEN 5 THEN 'Sat'
        WHEN 6 THEN 'Sun'
      END AS day_name
  ),
  daily_votes AS (
    SELECT 
      EXTRACT(DOW FROM cr.created_at) AS dow,
      COUNT(*) as vote_count
    FROM contestant_ratings cr
    WHERE cr.created_at >= date_trunc('week', CURRENT_DATE)
      AND cr.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
    GROUP BY EXTRACT(DOW FROM cr.created_at)
  ),
  daily_likes AS (
    SELECT 
      EXTRACT(DOW FROM l.created_at) AS dow,
      COUNT(*) as like_count
    FROM likes l
    WHERE l.created_at >= date_trunc('week', CURRENT_DATE)
      AND l.created_at < date_trunc('week', CURRENT_DATE) + interval '1 week'
      AND l.content_type = 'contest'
    GROUP BY EXTRACT(DOW FROM l.created_at)
  )
  
  SELECT 
    wd.day_num as day_of_week,
    wd.day_name,
    COALESCE(dv.vote_count, 0) as vote_count,
    COALESCE(dl.like_count, 0) as like_count
  FROM week_dates wd
  LEFT JOIN daily_votes dv ON (wd.day_num = CASE WHEN dv.dow = 0 THEN 6 ELSE dv.dow - 1 END)
  LEFT JOIN daily_likes dl ON (wd.day_num = CASE WHEN dl.dow = 0 THEN 6 ELSE dl.dow - 1 END)
  ORDER BY wd.day_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;