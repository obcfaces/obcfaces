-- Create function to update participant rating statistics
CREATE OR REPLACE FUNCTION update_participant_rating_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update weekly_contest_participants with correct rating statistics
  UPDATE weekly_contest_participants wcp
  SET 
    average_rating = COALESCE(stats.avg_rating, 0),
    total_votes = COALESCE(stats.vote_count, 0)
  FROM (
    SELECT 
      cr.contestant_user_id,
      AVG(cr.rating::numeric) as avg_rating,
      COUNT(*) as vote_count
    FROM contestant_ratings cr
    WHERE cr.contestant_user_id IS NOT NULL
    GROUP BY cr.contestant_user_id
  ) stats
  WHERE wcp.user_id = stats.contestant_user_id;
  
  -- Log the update
  RAISE NOTICE 'Updated rating statistics for weekly contest participants';
END;
$function$;

-- Execute the function to fix current data
SELECT update_participant_rating_stats();