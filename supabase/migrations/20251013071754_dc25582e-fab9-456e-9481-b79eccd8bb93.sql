-- Step 0: Create helper function for week start calculation in Indonesia timezone (WITA)
CREATE OR REPLACE FUNCTION public.get_week_monday_wita(ts TIMESTAMPTZ DEFAULT now())
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT (DATE_TRUNC('week', ts AT TIME ZONE 'Asia/Makassar'))::DATE;
$$;

-- Step 1: Convert all 'next week on site' → 'next week'
DO $$
DECLARE
  converted_count INTEGER;
BEGIN
  -- Count records to convert
  SELECT COUNT(*) INTO converted_count
  FROM public.weekly_contest_participants
  WHERE admin_status = 'next week on site'
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'Converting % participants from "next week on site" to "next week"', converted_count;
  
  -- Update status
  UPDATE public.weekly_contest_participants
  SET admin_status = 'next week'
  WHERE admin_status = 'next week on site'
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'Successfully converted % participants', converted_count;
END $$;

-- Step 2: Fix week_interval for 'past' participants that have current week interval
DO $$
DECLARE
  current_monday DATE;
  current_interval TEXT;
  last_monday DATE;
  last_interval TEXT;
  fixed_count INTEGER;
BEGIN
  -- Calculate current week Monday in WITA timezone
  current_monday := get_week_monday_wita(now());
  current_interval := TO_CHAR(current_monday, 'DD/MM') || '-' || 
                     TO_CHAR(current_monday + INTERVAL '6 days', 'DD/MM/YY');
  
  -- Calculate last week Monday
  last_monday := current_monday - INTERVAL '7 days';
  last_interval := TO_CHAR(last_monday, 'DD/MM') || '-' || 
                  TO_CHAR(last_monday + INTERVAL '6 days', 'DD/MM/YY');
  
  RAISE NOTICE 'Current week interval: %', current_interval;
  RAISE NOTICE 'Last week interval: %', last_interval;
  
  -- Count participants to fix
  SELECT COUNT(*) INTO fixed_count
  FROM public.weekly_contest_participants
  WHERE admin_status = 'past'
    AND (week_interval = current_interval OR week_interval IS NULL)
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'Fixing week_interval for % "past" participants', fixed_count;
  
  -- Fix week_interval for past participants that incorrectly have current week
  UPDATE public.weekly_contest_participants
  SET week_interval = last_interval
  WHERE admin_status = 'past'
    AND (week_interval = current_interval OR week_interval IS NULL)
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'Successfully fixed % participants', fixed_count;
END $$;

-- Step 3: Verification queries (logged as notices)
DO $$
DECLARE
  next_week_on_site_count INTEGER;
  this_week_count INTEGER;
  past_with_current_week INTEGER;
BEGIN
  -- Check if any 'next week on site' remain
  SELECT COUNT(*) INTO next_week_on_site_count
  FROM public.weekly_contest_participants
  WHERE admin_status = 'next week on site'
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'Remaining "next week on site" participants: %', next_week_on_site_count;
  
  -- Check 'this week' participants
  SELECT COUNT(*) INTO this_week_count
  FROM public.weekly_contest_participants
  WHERE admin_status = 'this week'
    AND deleted_at IS NULL;
  
  RAISE NOTICE 'Total "this week" participants: %', this_week_count;
  
  -- Check 'past' participants with current week (should be 0)
  SELECT COUNT(*) INTO past_with_current_week
  FROM public.weekly_contest_participants
  WHERE admin_status = 'past'
    AND week_interval = (
      TO_CHAR(get_week_monday_wita(now()), 'DD/MM') || '-' || 
      TO_CHAR(get_week_monday_wita(now()) + INTERVAL '6 days', 'DD/MM/YY')
    )
    AND deleted_at IS NULL;
  
  RAISE NOTICE '"Past" participants still with current week interval: %', past_with_current_week;
  
  IF next_week_on_site_count = 0 AND past_with_current_week = 0 THEN
    RAISE NOTICE '✅ Migration completed successfully!';
  ELSE
    RAISE WARNING '⚠️ Some issues remain - check the counts above';
  END IF;
END $$;