-- Fix the save_application_history trigger to save actual old status
CREATE OR REPLACE FUNCTION public.save_application_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Save the old version to history when data or notes change
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
      OLD.admin_status::text, -- Save the actual old admin_status instead of 'updated'
      OLD.notes, 
      auth.uid(),
      CASE 
        WHEN OLD.application_data IS DISTINCT FROM NEW.application_data THEN 'Application data updated'
        WHEN OLD.notes IS DISTINCT FROM NEW.notes THEN 'Notes updated'
        ELSE 'General update'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;