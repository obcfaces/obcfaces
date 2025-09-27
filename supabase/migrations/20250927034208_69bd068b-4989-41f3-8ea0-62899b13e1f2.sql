-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_weekly_contest_participants_public(integer);

-- Update admin_status based on contest week
UPDATE weekly_contest_participants 
SET admin_status = CASE 
  -- Current week participants
  WHEN EXISTS (
    SELECT 1 FROM weekly_contests wc 
    WHERE wc.id = weekly_contest_participants.contest_id 
    AND wc.week_start_date = (
      SELECT week_start_date 
      FROM weekly_contests 
      ORDER BY week_start_date DESC 
      LIMIT 1
    )
  ) THEN 'this week'
  -- Past week participants - assign week-specific status
  ELSE CONCAT(
    'week-', 
    TO_CHAR((
      SELECT wc.week_start_date 
      FROM weekly_contests wc 
      WHERE wc.id = weekly_contest_participants.contest_id
    ), 'DD/MM/YYYY')
  )
END
WHERE admin_status IS NULL OR admin_status NOT IN ('this week', 'next', 'inactive');

-- Create function to automatically assign admin_status on insert/update
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
  
  -- Get current week start date
  SELECT week_start_date INTO current_week_start
  FROM weekly_contests 
  ORDER BY week_start_date DESC 
  LIMIT 1;
  
  -- Assign status based on contest week
  IF contest_week_start = current_week_start THEN
    NEW.admin_status := 'this week';
  ELSE
    NEW.admin_status := CONCAT('week-', TO_CHAR(contest_week_start, 'DD/MM/YYYY'));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-assign status
DROP TRIGGER IF EXISTS auto_assign_participant_status_trigger ON weekly_contest_participants;
CREATE TRIGGER auto_assign_participant_status_trigger
  BEFORE INSERT OR UPDATE ON weekly_contest_participants
  FOR EACH ROW 
  WHEN (NEW.admin_status IS NULL OR NEW.admin_status = '')
  EXECUTE FUNCTION auto_assign_participant_status();