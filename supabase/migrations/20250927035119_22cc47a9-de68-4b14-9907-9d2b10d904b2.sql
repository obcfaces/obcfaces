-- Fix current week logic: 22-28 September 2025 is the current week

-- Update current week participants (22-28 September) to have 'this week' status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-22'
  LIMIT 1
);

-- Update participants from 23-29 September to 'next week' status  
UPDATE weekly_contest_participants 
SET admin_status = 'next'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-23'
  LIMIT 1
);

-- Update participants from 28 Sep - 04 Oct to 'next' status as well (future week)
UPDATE weekly_contest_participants 
SET admin_status = 'next'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-28'
  LIMIT 1
);

-- Update the trigger function to use Monday-based weeks (22-28 Sept is current)
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
  
  -- Calculate current week Monday (22 September 2025)
  -- Today is 27 Sept 2025, so current Monday is 22 Sept
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