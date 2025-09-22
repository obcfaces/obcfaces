-- Fix Function Search Path Mutable issues
-- Add search_path to functions that are missing it

-- Fix the archive_old_data function
CREATE OR REPLACE FUNCTION public.archive_old_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Архивируем рейтинги старше 1 года
  DELETE FROM contestant_ratings 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Архивируем лайки старше 6 месяцев для неактивных участников
  DELETE FROM likes 
  WHERE created_at < NOW() - INTERVAL '6 months'
    AND content_type = 'contest'
    AND content_id NOT IN (
      SELECT DISTINCT CONCAT('contestant-user-', user_id) 
      FROM weekly_contest_participants 
      WHERE is_active = true
    );
    
  -- Обновляем статистику
  PERFORM refresh_participant_stats();
END;
$function$;

-- Fix the refresh_participant_stats function
CREATE OR REPLACE FUNCTION public.refresh_participant_stats()
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.participant_stats;
$function$;

-- Fix the rotate_weekly_contests function
CREATE OR REPLACE FUNCTION public.rotate_weekly_contests()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_monday DATE;
  current_contest_id UUID;
  last_participation_date DATE;
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
    SELECT id INTO current_contest_id 
    FROM public.weekly_contests 
    WHERE week_start_date = current_monday;
  ELSE
    UPDATE public.weekly_contests 
    SET status = 'active', updated_at = now()
    WHERE id = current_contest_id;
  END IF;
  
  -- Move approved contest applications to current week, excluding users who participated recently
  INSERT INTO public.weekly_contest_participants (contest_id, user_id, application_data)
  SELECT 
    current_contest_id,
    ca.user_id,
    ca.application_data
  FROM public.contest_applications ca
  WHERE ca.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public.weekly_contest_participants wcp
      WHERE wcp.user_id = ca.user_id 
        AND wcp.contest_id = current_contest_id
    )
    -- Exclude users who participated in the last 4 weeks
    AND NOT EXISTS (
      SELECT 1 FROM public.weekly_contest_participants wcp2
      JOIN public.weekly_contests wc2 ON wcp2.contest_id = wc2.id
      WHERE wcp2.user_id = ca.user_id 
        AND wc2.week_start_date >= current_monday - INTERVAL '28 days'
        AND wc2.week_start_date < current_monday
    );
END;
$function$;