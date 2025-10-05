-- Fix save_rating_history trigger to remove references to non-existent contestant_user_id column
-- The contestant_ratings table only has: id, user_id, contestant_name, participant_id, rating, created_at, updated_at

-- Drop existing trigger
DROP TRIGGER IF EXISTS rating_history_trigger ON contestant_ratings;
DROP TRIGGER IF EXISTS save_rating_history_trigger ON contestant_ratings;

-- Recreate the function without contestant_user_id references
CREATE OR REPLACE FUNCTION public.save_rating_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.contestant_rating_history (
      rating_id,
      user_id,
      participant_id,
      contestant_name,
      old_rating,
      new_rating,
      action_type
    ) VALUES (
      OLD.id,
      OLD.user_id,
      OLD.participant_id,
      OLD.contestant_name,
      OLD.rating,
      0, -- Use 0 instead of NULL for deleted records
      'delete'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.contestant_rating_history (
      rating_id,
      user_id,
      participant_id,
      contestant_name,
      old_rating,
      new_rating,
      action_type
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.participant_id,
      NEW.contestant_name,
      OLD.rating,
      NEW.rating,
      'update'
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.contestant_rating_history (
      rating_id,
      user_id,
      participant_id,
      contestant_name,
      old_rating,
      new_rating,
      action_type
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.participant_id,
      NEW.contestant_name,
      0, -- No old rating for new records
      NEW.rating,
      'insert'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER save_rating_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contestant_ratings
  FOR EACH ROW 
  EXECUTE FUNCTION public.save_rating_history();