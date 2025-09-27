-- Create function to automatically assign admin_status based on contest week
CREATE OR REPLACE FUNCTION public.auto_assign_weekly_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_monday DATE;
  participant_record RECORD;
  week_status TEXT;
BEGIN
  -- Get current Monday
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Update all participants with automatic status based on their contest week
  FOR participant_record IN 
    SELECT 
      wcp.id,
      wcp.contest_id,
      wc.week_start_date,
      wcp.admin_status
    FROM weekly_contest_participants wcp
    JOIN weekly_contests wc ON wcp.contest_id = wc.id
    WHERE wcp.is_active = true
  LOOP
    -- Determine the appropriate status
    IF participant_record.week_start_date = current_monday THEN
      -- Current week participants get 'this week' status
      week_status := 'this week';
    ELSE
      -- Past week participants get week-specific status
      week_status := 'week-' || participant_record.week_start_date::text;
    END IF;
    
    -- Only update if status is not manually set or is the default
    IF participant_record.admin_status IS NULL 
       OR participant_record.admin_status = 'this week' 
       OR participant_record.admin_status LIKE 'week-%' THEN
      UPDATE weekly_contest_participants 
      SET admin_status = week_status
      WHERE id = participant_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Auto-assigned weekly statuses for current Monday: %', current_monday;
END;
$$;

-- Run the function to assign statuses
SELECT auto_assign_weekly_status();

-- Create trigger to automatically assign status on insert
CREATE OR REPLACE FUNCTION public.assign_status_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_monday DATE;
  contest_week DATE;
  week_status TEXT;
BEGIN
  -- Get current Monday
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Get the contest week
  SELECT week_start_date INTO contest_week
  FROM weekly_contests 
  WHERE id = NEW.contest_id;
  
  -- Assign appropriate status if not manually set
  IF NEW.admin_status IS NULL THEN
    IF contest_week = current_monday THEN
      NEW.admin_status := 'this week';
    ELSE
      NEW.admin_status := 'week-' || contest_week::text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic status assignment
DROP TRIGGER IF EXISTS auto_assign_status_trigger ON weekly_contest_participants;
CREATE TRIGGER auto_assign_status_trigger
  BEFORE INSERT ON weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION assign_status_on_insert();