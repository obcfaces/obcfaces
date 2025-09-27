-- Correct week calculation: Current week is 22-28 September 2025
-- Next week should be 29 September - 5 October 2025

-- Update current week participants (22-28 September) to have 'this week' status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-22'
  LIMIT 1
);

-- Update the trigger function with correct Monday (22 September)
CREATE OR REPLACE FUNCTION public.auto_assign_participant_status()
RETURNS TRIGGER AS $$
DECLARE
  contest_week_start DATE;
  current_week_monday DATE;
BEGIN
  -- Get the contest week start date
  SELECT week_start_date INTO contest_week_start
  FROM weekly_contests 
  WHERE id = NEW.contest_id;
  
  -- Current week Monday is 22 September 2025
  current_week_monday := '2025-09-22'::DATE;
  
  -- Assign status based on contest week
  IF contest_week_start = current_week_monday THEN
    NEW.admin_status := 'this week';
  ELSIF contest_week_start > current_week_monday THEN
    NEW.admin_status := 'next';
  ELSE
    NEW.admin_status := CONCAT('week-', TO_CHAR(contest_week_start, 'DD/MM/YYYY'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;