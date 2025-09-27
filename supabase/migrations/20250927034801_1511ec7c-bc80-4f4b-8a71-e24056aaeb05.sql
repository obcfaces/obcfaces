-- Fix the admin_status assignment logic
-- Current week should be 'this week', not 'week-YYYY-MM-DD'

-- Update current week participants to have 'this week' status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date <= CURRENT_DATE 
  AND week_end_date >= CURRENT_DATE
  ORDER BY week_start_date DESC 
  LIMIT 1
);

-- Update the trigger function to assign correct statuses
CREATE OR REPLACE FUNCTION public.auto_assign_participant_status()
RETURNS TRIGGER AS $$
DECLARE
  contest_week_start DATE;
  current_week_start DATE;
BEGIN
  -- Get the contest week start date
  SELECT week_start_date INTO contest_week_start
  FROM weekly_contests 
  WHERE id = NEW.contest_id;
  
  -- Get current week start date (week that includes today)
  SELECT week_start_date INTO current_week_start
  FROM weekly_contests 
  WHERE week_start_date <= CURRENT_DATE 
  AND week_end_date >= CURRENT_DATE
  ORDER BY week_start_date DESC 
  LIMIT 1;
  
  -- Assign status based on contest week
  IF contest_week_start = current_week_start THEN
    NEW.admin_status := 'this week';
  ELSIF contest_week_start > current_week_start THEN
    NEW.admin_status := 'next';
  ELSE
    NEW.admin_status := CONCAT('week-', TO_CHAR(contest_week_start, 'DD/MM/YYYY'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;