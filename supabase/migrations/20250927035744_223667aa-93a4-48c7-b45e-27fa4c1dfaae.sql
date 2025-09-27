-- Correct week calculation: 23 Sept is TUESDAY, not Monday!
-- Current week: 22-28 September 2025 (Monday to Sunday)  
-- Next week: 29 September - 5 October 2025 (Monday to Sunday)

-- Update current week participants (22-28 September) to have 'this week' status
UPDATE weekly_contest_participants 
SET admin_status = 'this week'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-22'
  LIMIT 1
);

-- Check if next week contest exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM weekly_contests WHERE week_start_date = '2025-09-29') THEN
    INSERT INTO weekly_contests (week_start_date, week_end_date, title, status)
    VALUES ('2025-09-29', '2025-10-05', 'Contest 29.09-05.10.2025', 'upcoming');
  ELSE
    UPDATE weekly_contests 
    SET week_end_date = '2025-10-05', title = 'Contest 29.09-05.10.2025'
    WHERE week_start_date = '2025-09-29';
  END IF;
END $$;

-- Update next week participants (29 Sep - 5 Oct) to have 'next' status
UPDATE weekly_contest_participants 
SET admin_status = 'next'
WHERE contest_id = (
  SELECT id FROM weekly_contests 
  WHERE week_start_date = '2025-09-29'
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
  -- (since 23 Sept is Tuesday, 22 Sept is Monday)
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