-- Fix weekly contest transition to assign correct week_interval for past participants
-- They should get the interval of the week they participated in, not the current week

CREATE OR REPLACE FUNCTION public.transition_weekly_contest(target_week_start date, dry_run boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  week_end_date DATE;
  week_interval_str TEXT;
  prev_week_start DATE;
  prev_week_end DATE;
  prev_week_interval_str TEXT;
  run_uuid UUID;
  transition_counts JSONB;
  winner_data JSONB;
  this_to_past_count INT := 0;
  next_site_to_this_count INT := 0;
  pre_next_to_next_count INT := 0;
  winner_user_id UUID;
  winner_rating NUMERIC;
  winner_votes INT;
BEGIN
  -- Calculate current week dates
  week_end_date := target_week_start + INTERVAL '6 days';
  week_interval_str := TO_CHAR(target_week_start, 'DD/MM') || '-' || TO_CHAR(week_end_date, 'DD/MM/YY');
  
  -- Calculate PREVIOUS week dates (for participants moving to past)
  prev_week_start := target_week_start - INTERVAL '7 days';
  prev_week_end := prev_week_start + INTERVAL '6 days';
  prev_week_interval_str := TO_CHAR(prev_week_start, 'DD/MM') || '-' || TO_CHAR(prev_week_end, 'DD/MM/YY');
  
  -- Generate unique run ID
  run_uuid := gen_random_uuid();
  
  -- Check if transition already completed for this week
  IF EXISTS (
    SELECT 1 FROM weekly_contest_participants
    WHERE week_interval = prev_week_interval_str
    AND admin_status = 'past'
    LIMIT 1
  ) THEN
    RETURN jsonb_build_object(
      'status', 'already_completed',
      'week_start_date', target_week_start,
      'week_end_date', week_end_date,
      'week_interval', week_interval_str,
      'run_id', run_uuid,
      'message', 'Transition already completed for this week'
    );
  END IF;
  
  IF dry_run THEN
    -- DRY RUN: Just count what would be changed
    SELECT COUNT(*) INTO this_to_past_count
    FROM weekly_contest_participants
    WHERE admin_status = 'this week' AND is_active = true AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO next_site_to_this_count
    FROM weekly_contest_participants
    WHERE admin_status = 'next week on site' AND is_active = true AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO pre_next_to_next_count
    FROM weekly_contest_participants
    WHERE admin_status = 'pre next week' AND is_active = true AND deleted_at IS NULL;
    
    -- Get potential winner
    SELECT 
      user_id,
      average_rating,
      total_votes
    INTO winner_user_id, winner_rating, winner_votes
    FROM weekly_contest_participants
    WHERE admin_status = 'this week' AND is_active = true AND deleted_at IS NULL
    ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
    LIMIT 1;
    
    IF winner_user_id IS NOT NULL THEN
      winner_data := jsonb_build_object(
        'user_id', winner_user_id,
        'average_rating', winner_rating,
        'total_votes', winner_votes
      );
    END IF;
    
    RETURN jsonb_build_object(
      'status', 'dry_run',
      'week_start_date', target_week_start,
      'week_end_date', week_end_date,
      'week_interval', week_interval_str,
      'prev_week_interval', prev_week_interval_str,
      'run_id', run_uuid,
      'transitions', jsonb_build_object(
        'thisWeekToPast', this_to_past_count,
        'nextWeekOnSiteToThisWeek', next_site_to_this_count,
        'preNextWeekToNextWeek', pre_next_to_next_count
      ),
      'winner', winner_data,
      'snapshot', false
    );
  END IF;
  
  -- REAL EXECUTION: Begin atomic transaction
  
  -- 1. DETERMINE WINNER (from current "this week")
  SELECT 
    user_id,
    average_rating,
    total_votes
  INTO winner_user_id, winner_rating, winner_votes
  FROM weekly_contest_participants
  WHERE admin_status = 'this week' AND is_active = true AND deleted_at IS NULL
  ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
  LIMIT 1;
  
  -- 2. SET FINAL RANK for "this week" participants before moving to past
  WITH ranked_participants AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY average_rating DESC NULLS LAST, total_votes DESC NULLS LAST
      ) as rank
    FROM weekly_contest_participants
    WHERE admin_status = 'this week' AND is_active = true AND deleted_at IS NULL
  )
  UPDATE weekly_contest_participants wcp
  SET final_rank = rp.rank
  FROM ranked_participants rp
  WHERE wcp.id = rp.id;
  
  -- 3. TRANSITION: "this week" → "past" with PREVIOUS week interval
  UPDATE weekly_contest_participants
  SET 
    admin_status = 'past',
    week_interval = prev_week_interval_str
  WHERE admin_status = 'this week' 
    AND is_active = true 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS this_to_past_count = ROW_COUNT;
  
  -- 4. TRANSITION: "next week on site" → "this week" with CURRENT week interval
  UPDATE weekly_contest_participants
  SET 
    admin_status = 'this week',
    week_interval = week_interval_str
  WHERE admin_status = 'next week on site' 
    AND is_active = true 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS next_site_to_this_count = ROW_COUNT;
  
  -- 5. TRANSITION: "pre next week" → "next week on site"
  UPDATE weekly_contest_participants
  SET 
    admin_status = 'next week on site',
    week_interval = week_interval_str
  WHERE admin_status = 'pre next week' 
    AND is_active = true 
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS pre_next_to_next_count = ROW_COUNT;
  
  -- Build winner data if exists
  IF winner_user_id IS NOT NULL THEN
    winner_data := jsonb_build_object(
      'user_id', winner_user_id,
      'average_rating', winner_rating,
      'total_votes', winner_votes
    );
  END IF;
  
  -- Build response
  transition_counts := jsonb_build_object(
    'thisWeekToPast', this_to_past_count,
    'nextWeekOnSiteToThisWeek', next_site_to_this_count,
    'preNextWeekToNextWeek', pre_next_to_next_count
  );
  
  RETURN jsonb_build_object(
    'status', 'success',
    'week_start_date', target_week_start,
    'week_end_date', week_end_date,
    'week_interval', week_interval_str,
    'prev_week_interval', prev_week_interval_str,
    'run_id', run_uuid,
    'transitions', transition_counts,
    'winner', winner_data,
    'message', 'Weekly contest transition completed successfully'
  );
END;
$function$;