-- Fix trigger function that creates invalid week-YYYY-MM-DD statuses
-- This function should use proper status names: 'this week', 'past', 'next week'

CREATE OR REPLACE FUNCTION public.assign_status_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_monday DATE;
  contest_week DATE;
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
      -- Contest week is current week
      NEW.admin_status := 'this week';
    ELSIF contest_week > current_monday THEN
      -- Contest week is in the future
      NEW.admin_status := 'next week';
    ELSE
      -- Contest week is in the past
      NEW.admin_status := 'past';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also verify all existing records don't have week-YYYY-MM-DD format
UPDATE weekly_contest_participants
SET admin_status = CASE
  WHEN admin_status LIKE 'week-2025%' THEN 'past'
  ELSE admin_status
END
WHERE admin_status LIKE 'week-%'
  AND is_active = true;