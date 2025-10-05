-- Assign final_rank to participants in week interval 06/10-12/10/25 based on current rating
-- First, reset final_rank for this interval
UPDATE weekly_contest_participants
SET final_rank = NULL
WHERE week_interval = '06/10-12/10/25'
  AND deleted_at IS NULL;

-- Now assign ranks based on average_rating and total_votes
WITH ranked_participants AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      ORDER BY 
        average_rating DESC NULLS LAST, 
        total_votes DESC NULLS LAST
    ) as new_rank
  FROM weekly_contest_participants
  WHERE week_interval = '06/10-12/10/25'
    AND deleted_at IS NULL
    AND admin_status = 'past'
)
UPDATE weekly_contest_participants wcp
SET final_rank = rp.new_rank
FROM ranked_participants rp
WHERE wcp.id = rp.id;