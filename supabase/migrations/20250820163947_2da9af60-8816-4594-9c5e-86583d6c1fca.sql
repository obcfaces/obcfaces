-- Fix search_path for rotate_weekly_contests function
CREATE OR REPLACE FUNCTION public.rotate_weekly_contests()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_monday DATE;
  current_contest_id UUID;
BEGIN
  current_monday := get_week_monday(CURRENT_DATE);
  
  -- Close previous week's contest
  UPDATE public.weekly_contests 
  SET status = 'closed', updated_at = now()
  WHERE status = 'active' AND week_start_date < current_monday;
  
  -- Create or activate current week's contest
  SELECT id INTO current_contest_id 
  FROM public.weekly_contests 
  WHERE week_start_date = current_monday;
  
  IF current_contest_id IS NULL THEN
    PERFORM create_weekly_contest(CURRENT_DATE);
  ELSE
    UPDATE public.weekly_contests 
    SET status = 'active', updated_at = now()
    WHERE id = current_contest_id;
  END IF;
  
  -- Move approved contest applications to current week
  INSERT INTO public.weekly_contest_participants (contest_id, user_id, application_data)
  SELECT 
    (SELECT id FROM public.weekly_contests WHERE status = 'active' AND week_start_date = current_monday),
    ca.user_id,
    ca.application_data
  FROM public.contest_applications ca
  WHERE ca.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.weekly_contest_participants wcp
      WHERE wcp.user_id = ca.user_id 
        AND wcp.contest_id = (
          SELECT id FROM public.weekly_contests 
          WHERE status = 'active' AND week_start_date = current_monday
        )
    );
END;
$$;