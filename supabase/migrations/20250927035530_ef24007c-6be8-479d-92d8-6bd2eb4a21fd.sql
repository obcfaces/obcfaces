-- Fix the incorrect week that starts on Sunday (28 Sep)
-- Change it to proper Monday-Sunday week (30 Sep - 6 Oct)

UPDATE weekly_contests 
SET 
  week_start_date = '2025-09-30',
  week_end_date = '2025-10-06',
  title = 'Contest 30.09-06.10.2025'
WHERE week_start_date = '2025-09-28';

-- Update the trigger function to use correct current week Monday (30 September)
-- Since today is 27 Sept 2025 (Friday), current week is 23-29 Sept
-- Next week should be 30 Sept - 6 Oct
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

-- Update participants for corrected next week (30 Sep - 6 Oct)
UPDATE weekly_contest_participants 
SET admin_status = 'next'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-30'
  LIMIT 1
);