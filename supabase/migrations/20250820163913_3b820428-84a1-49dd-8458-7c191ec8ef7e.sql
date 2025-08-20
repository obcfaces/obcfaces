-- Fix search_path for create_weekly_contest function
CREATE OR REPLACE FUNCTION public.create_weekly_contest(contest_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  week_monday DATE;
  week_sunday DATE;
  contest_id UUID;
  contest_title TEXT;
BEGIN
  week_monday := get_week_monday(contest_date);
  week_sunday := week_monday + INTERVAL '6 days';
  
  -- Generate title based on date
  contest_title := 'Contest ' || TO_CHAR(week_monday, 'DD.MM') || '-' || TO_CHAR(week_sunday, 'DD.MM.YYYY');
  
  -- Check if contest already exists for this week
  SELECT id INTO contest_id 
  FROM public.weekly_contests 
  WHERE week_start_date = week_monday;
  
  IF contest_id IS NULL THEN
    INSERT INTO public.weekly_contests (week_start_date, week_end_date, title, status)
    VALUES (week_monday, week_sunday, contest_title, 'active')
    RETURNING id INTO contest_id;
  END IF;
  
  RETURN contest_id;
END;
$$;