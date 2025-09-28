-- First, fix the rating history trigger to handle NULL new_rating for DELETE operations
CREATE OR REPLACE FUNCTION save_rating_history()
RETURNS TRIGGER AS $$
BEGIN
  -- For UPDATE operations
  IF TG_OP = 'UPDATE' THEN
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
    RETURN NEW;
  END IF;
  
  -- For INSERT operations
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
      NULL,
      NEW.rating,
      'insert'
    );
    RETURN NEW;
  END IF;
  
  -- For DELETE operations - don't log to history for cleanup operations
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;