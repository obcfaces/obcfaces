
-- Fix invalid admin_status values that start with 'week-'
-- These should be converted to proper status names

UPDATE weekly_contest_participants
SET admin_status = 'past',
    week_interval = CASE 
      WHEN admin_status LIKE 'week-2025-09-23%' THEN '22/09-28/09/25'
      WHEN admin_status LIKE 'week-2025-09-29%' OR admin_status LIKE 'week-2025-09-30%' 
           OR admin_status LIKE 'week-2025-10-01%' THEN '29/09-05/10/25'
      ELSE week_interval
    END
WHERE admin_status LIKE 'week-%';

-- Log the fixed participants
DO $$
DECLARE
  fixed_count INT;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % participants with invalid admin_status', fixed_count;
END $$;
