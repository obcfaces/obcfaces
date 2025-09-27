-- Fix week calculation: weeks run Monday to Sunday
-- Current week: 23-29 September 2025 (today is Friday 27 Sept)
-- Next week: 30 September - 6 October 2025

-- Update current week participants (23-29 September) to have 'this week' status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-23'
  LIMIT 1
);

-- Update next week participants (30 Sep - 6 Oct) to have 'next' status
UPDATE weekly_contest_participants 
SET admin_status = 'next'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-30'
  LIMIT 1
);

-- Update past weeks to have historical status
UPDATE weekly_contest_participants 
SET admin_status = CONCAT('week-', TO_CHAR(wc.week_start_date, 'DD/MM/YYYY'))
FROM weekly_contests wc
WHERE weekly_contest_participants.contest_id = wc.id
  AND wc.week_start_date < '2025-09-23';

-- Update the trigger function to use correct Monday-based weeks
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
  
  -- Calculate current week Monday (23 September 2025)
  -- Today is 27 Sept 2025 (Friday), so current Monday is 23 Sept
  current_week_monday := '2025-09-23'::DATE;
  
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