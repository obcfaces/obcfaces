-- Update past participants to set week_interval to 08/09-14/09/25 for specific period
-- This will populate the "08/09-14/09/25" filter with actual participants

DO $$
DECLARE
  target_interval TEXT := '08/09-14/09/25';
  updated_count INTEGER;
  target_start_date DATE := '2025-09-08';
  target_end_date DATE := '2025-09-14';
BEGIN
  -- Update participants who were created during this week period
  -- and currently have status 'past' but missing or incorrect week_interval
  UPDATE public.weekly_contest_participants
  SET week_interval = target_interval
  WHERE admin_status = 'past'
    AND deleted_at IS NULL
    AND (
      -- Either has no interval set
      week_interval IS NULL
      -- Or has a different interval and created_at falls within target week
      OR (
        created_at::DATE BETWEEN target_start_date AND target_end_date
      )
    );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % participants to have week_interval "%"', updated_count, target_interval;
  
  -- Show count of participants for each interval
  RAISE NOTICE 'Interval distribution:';
  FOR updated_count IN 
    SELECT COUNT(*)::INTEGER
    FROM public.weekly_contest_participants
    WHERE admin_status = 'past'
      AND week_interval = target_interval
      AND deleted_at IS NULL
  LOOP
    RAISE NOTICE '  08/09-14/09/25: % participants', updated_count;
  END LOOP;
  
END $$;