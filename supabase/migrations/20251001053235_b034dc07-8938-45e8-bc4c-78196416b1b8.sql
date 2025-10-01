-- Remove policies that depend on status column first
DROP POLICY IF EXISTS "Users can update their own pending applications" ON contest_applications;
DROP POLICY IF EXISTS "Admins and moderators can update applications" ON contest_applications;

-- Drop the status column and related columns
ALTER TABLE contest_applications DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE contest_applications DROP COLUMN IF EXISTS approved_at;
ALTER TABLE contest_applications DROP COLUMN IF EXISTS rejected_at;
ALTER TABLE contest_applications DROP COLUMN IF EXISTS rejection_reason;
ALTER TABLE contest_applications DROP COLUMN IF EXISTS rejection_reason_types;

-- Recreate simplified RLS policies
CREATE POLICY "Users can update their own applications"
ON contest_applications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all applications"
ON contest_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Update the trigger function to not reference status
CREATE OR REPLACE FUNCTION public.save_application_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Save the old version to history when data or notes change
  IF OLD.application_data != NEW.application_data OR OLD.notes != NEW.notes THEN
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
      'updated', -- generic status for history
      OLD.notes, 
      auth.uid(),
      CASE 
        WHEN OLD.application_data != NEW.application_data THEN 'Application data updated'
        WHEN OLD.notes != NEW.notes THEN 'Notes updated'
        ELSE 'General update'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;