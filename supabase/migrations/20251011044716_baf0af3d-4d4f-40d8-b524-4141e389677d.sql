-- Fix trigger to reset status to pending when user resubmits the form
-- This ensures that when a user updates their application (detected by submitted_at change),
-- the status automatically resets to 'pending' for admin review

CREATE OR REPLACE FUNCTION public.reset_status_on_resubmit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- If submitted_at is being updated (user resubmitted the form)
  -- AND the current status is 'rejected' or any other status except 'pending'
  -- THEN reset to 'pending' for admin to review again
  IF (NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) 
     AND (OLD.admin_status != 'pending') THEN
    
    NEW.admin_status = 'pending';
    
    -- Add entry to status_history
    NEW.status_history = COALESCE(NEW.status_history, '{}'::jsonb) || jsonb_build_object(
      'pending_resubmit_' || to_char(NEW.submitted_at, 'YYYY-MM-DD_HH24:MI:SS'), 
      jsonb_build_object(
        'changed_at', NEW.submitted_at,
        'changed_by', NEW.user_id,
        'changed_by_email', 'user',
        'change_reason', CONCAT('User re-submitted form (was ', OLD.admin_status, ')'),
        'old_status', OLD.admin_status,
        'new_status', 'pending',
        'timestamp', NEW.submitted_at,
        'week_interval', NEW.week_interval
      )
    );
    
    RAISE NOTICE 'Status reset to pending due to resubmission: % -> pending', OLD.admin_status;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS reset_status_on_resubmit_trigger ON weekly_contest_participants;

-- Create trigger that fires BEFORE UPDATE
CREATE TRIGGER reset_status_on_resubmit_trigger
  BEFORE UPDATE ON weekly_contest_participants
  FOR EACH ROW
  WHEN (NEW.submitted_at IS DISTINCT FROM OLD.submitted_at)
  EXECUTE FUNCTION reset_status_on_resubmit();