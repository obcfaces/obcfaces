-- Create table for application history
CREATE TABLE public.contest_application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.contest_applications(id) ON DELETE CASCADE,
  application_data JSONB,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contest_application_history ENABLE ROW LEVEL SECURITY;

-- Create policies for history table
CREATE POLICY "Admins and moderators can view all application history"
ON public.contest_application_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins and moderators can insert application history"
ON public.contest_application_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create function to save application history
CREATE OR REPLACE FUNCTION public.save_application_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Create trigger to automatically save history
CREATE TRIGGER save_application_history_trigger
  BEFORE UPDATE ON public.contest_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.save_application_history();

-- Create index for better performance
CREATE INDEX idx_application_history_application_id ON public.contest_application_history(application_id);
CREATE INDEX idx_application_history_created_at ON public.contest_application_history(created_at DESC);