-- Update RLS policies for contest applications to prevent editing after approval
DROP POLICY IF EXISTS "Users can update their own pending applications" ON public.contest_applications;

-- Users can only update their own applications if status is 'pending' or 'under_review'
CREATE POLICY "Users can update their own pending applications" 
ON public.contest_applications 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND status IN ('pending', 'under_review')
) 
WITH CHECK (
  auth.uid() = user_id 
  AND status IN ('pending', 'under_review')
);

-- Add trigger to save application history on every update
CREATE OR REPLACE FUNCTION public.save_application_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Save the old version to history when status or data changes
  IF OLD.status != NEW.status OR OLD.application_data != NEW.application_data OR OLD.notes != NEW.notes THEN
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
      OLD.status, 
      OLD.notes, 
      auth.uid(),
      CASE 
        WHEN OLD.status != NEW.status THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
        WHEN OLD.application_data != NEW.application_data THEN 'Application data updated'
        WHEN OLD.notes != NEW.notes THEN 'Notes updated'
        ELSE 'General update'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_save_application_history ON public.contest_applications;
CREATE TRIGGER trigger_save_application_history
  BEFORE UPDATE ON public.contest_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.save_application_history();

-- Update RLS policies for contest_application_history to allow users to view their own history
DROP POLICY IF EXISTS "Users can view their own application history" ON public.contest_application_history;
CREATE POLICY "Users can view their own application history" 
ON public.contest_application_history 
FOR SELECT 
USING (
  application_id IN (
    SELECT id FROM public.contest_applications 
    WHERE user_id = auth.uid()
  )
);