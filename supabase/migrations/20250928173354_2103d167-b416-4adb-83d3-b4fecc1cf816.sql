-- Fix participant statuses for current week
-- Update participants with admin_status "week-2025-09-28" to "this week" for current contest
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'week-2025-09-28'
AND contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-28' 
  AND status = 'active'
  LIMIT 1
);

-- Also update any participants with pending status to this week for current contest
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE admin_status = 'pending'
AND contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-28' 
  AND status = 'active'
  LIMIT 1
);

-- Create a function to properly transition statuses when a new week starts
CREATE OR REPLACE FUNCTION transition_weekly_participant_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_monday DATE;
  current_contest_id UUID;
BEGIN
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Get current week contest
  SELECT id INTO current_contest_id 
  FROM weekly_contests 
  WHERE week_start_date = current_monday AND status = 'active';
  
  IF current_contest_id IS NOT NULL THEN
    -- Move participants from "next week on site" to "this week"
    UPDATE weekly_contest_participants 
    SET admin_status = 'this week'
    WHERE admin_status = 'next week on site'
    AND contest_id = current_contest_id;
    
    -- Move participants from "next week" to "next week on site" 
    UPDATE weekly_contest_participants 
    SET admin_status = 'next week on site'
    WHERE admin_status = 'next week'
    AND contest_id = current_contest_id;
    
    RAISE NOTICE 'Transitioned participant statuses for week starting %', current_monday;
  END IF;
END;
$$;