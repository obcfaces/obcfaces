-- Update trigger to save initial pending status and user re-submissions to history
CREATE OR REPLACE FUNCTION public.save_application_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: Save initial pending status
  IF TG_OP = 'INSERT' THEN
    NEW.status_history = jsonb_build_object(
      'pending', jsonb_build_object(
        'changed_at', NEW.created_at,
        'changed_by', NEW.user_id,
        'changed_by_email', 'user',
        'change_reason', 'Application submitted',
        'timestamp', NEW.created_at,
        'week_interval', NEW.week_interval
      )
    );
    RETURN NEW;
  END IF;
  
  -- On UPDATE: Save to history when data or notes change
  IF TG_OP = 'UPDATE' THEN
    -- Save the old version to contest_application_history table
    IF OLD.application_data IS DISTINCT FROM NEW.application_data OR OLD.notes IS DISTINCT FROM NEW.notes THEN
      INSERT INTO public.contest_application_history (
        application_id, 
        application_data, 
        status, 
        notes, 
        changed_by,
        change_reason
      ) VALUES (
        OLD.id, 
        OLD.application_data, 
        OLD.admin_status::text,
        OLD.notes, 
        auth.uid(),
        CASE 
          WHEN OLD.application_data IS DISTINCT FROM NEW.application_data THEN 'Application data updated'
          WHEN OLD.notes IS DISTINCT FROM NEW.notes THEN 'Notes updated'
          ELSE 'General update'
        END
      );
    END IF;
    
    -- If status changed from rejected to pending (user resubmission)
    IF OLD.admin_status = 'rejected' AND NEW.admin_status = 'pending' THEN
      NEW.status_history = COALESCE(NEW.status_history, '{}'::jsonb) || jsonb_build_object(
        'pending_resubmit_' || to_char(now(), 'YYYY-MM-DD_HH24:MI:SS'), jsonb_build_object(
          'changed_at', now(),
          'changed_by', NEW.user_id,
          'changed_by_email', 'user',
          'change_reason', 'User re-submitted after rejection',
          'old_status', OLD.admin_status,
          'new_status', NEW.admin_status,
          'timestamp', now(),
          'week_interval', NEW.week_interval
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;