-- Update all 'pre next week' participants to current week interval
UPDATE weekly_contest_participants
SET week_interval = '22/09-28/09/25'
WHERE admin_status = 'pre next week'
  AND (week_interval IS NULL OR week_interval != '22/09-28/09/25');

-- Create or replace trigger function to auto-assign week_interval on status change
CREATE OR REPLACE FUNCTION public.auto_assign_week_interval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_monday DATE;
  current_sunday DATE;
  interval_string TEXT;
BEGIN
  -- Only proceed if admin_status is being changed
  IF (TG_OP = 'INSERT' OR OLD.admin_status IS DISTINCT FROM NEW.admin_status) THEN
    -- Get current week Monday
    current_monday := get_week_monday(CURRENT_DATE);
    current_sunday := current_monday + INTERVAL '6 days';
    
    -- Format interval string as DD/MM-DD/MM/YY
    interval_string := TO_CHAR(current_monday, 'DD/MM') || '-' || TO_CHAR(current_sunday, 'DD/MM/YY');
    
    -- Assign week_interval based on the new status
    IF NEW.admin_status IN ('pre next week', 'next week', 'next week on site', 'this week') THEN
      NEW.week_interval := interval_string;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS set_week_interval_on_status_change ON weekly_contest_participants;

CREATE TRIGGER set_week_interval_on_status_change
  BEFORE INSERT OR UPDATE OF admin_status ON weekly_contest_participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_week_interval();