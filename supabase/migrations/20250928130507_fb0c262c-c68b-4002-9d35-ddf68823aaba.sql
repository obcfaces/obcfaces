-- Create table for rating history
CREATE TABLE public.contestant_rating_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID NOT NULL, -- Reference to the original rating record
  user_id UUID NOT NULL, -- User who made the rating
  contestant_user_id UUID,
  participant_id UUID,
  contestant_name TEXT NOT NULL,
  old_rating INTEGER, -- Previous rating value (NULL for new records)
  new_rating INTEGER NOT NULL, -- New rating value
  action_type TEXT NOT NULL DEFAULT 'update', -- 'insert', 'update', 'delete'
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contestant_rating_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rating history
CREATE POLICY "Admins and moderators can view all rating history" 
ON public.contestant_rating_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users can view their own rating history" 
ON public.contestant_rating_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert rating history" 
ON public.contestant_rating_history 
FOR INSERT 
WITH CHECK (true); -- Allow system inserts via triggers

-- Create function to save rating history
CREATE OR REPLACE FUNCTION public.save_rating_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.contestant_rating_history (
      rating_id,
      user_id,
      contestant_user_id,
      participant_id,
      contestant_name,
      old_rating,
      new_rating,
      action_type
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.contestant_user_id,
      NEW.participant_id,
      NEW.contestant_name,
      NULL, -- No old rating for new records
      NEW.rating,
      'insert'
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Only log if rating actually changed
    IF OLD.rating != NEW.rating THEN
      INSERT INTO public.contestant_rating_history (
        rating_id,
        user_id,
        contestant_user_id,
        participant_id,
        contestant_name,
        old_rating,
        new_rating,
        action_type
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.contestant_user_id,
        NEW.participant_id,
        NEW.contestant_name,
        OLD.rating,
        NEW.rating,
        'update'
      );
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.contestant_rating_history (
      rating_id,
      user_id,
      contestant_user_id,
      participant_id,
      contestant_name,
      old_rating,
      new_rating,
      action_type
    ) VALUES (
      OLD.id,
      OLD.user_id,
      OLD.contestant_user_id,
      OLD.participant_id,
      OLD.contestant_name,
      OLD.rating,
      NULL, -- No new rating for deleted records
      'delete'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger to automatically log rating changes
CREATE TRIGGER rating_history_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.contestant_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.save_rating_history();

-- Create index for better query performance
CREATE INDEX idx_contestant_rating_history_user_id ON public.contestant_rating_history(user_id);
CREATE INDEX idx_contestant_rating_history_rating_id ON public.contestant_rating_history(rating_id);
CREATE INDEX idx_contestant_rating_history_changed_at ON public.contestant_rating_history(changed_at DESC);