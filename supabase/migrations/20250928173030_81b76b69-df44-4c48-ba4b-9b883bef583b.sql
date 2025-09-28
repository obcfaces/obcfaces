-- Temporarily disable the rating history trigger
DROP TRIGGER IF EXISTS save_rating_history_trigger ON contestant_ratings;

-- Delete duplicate ratings, keeping the latest one for each user-contestant pair
WITH ranked_ratings AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, contestant_name ORDER BY updated_at DESC) as rn
  FROM contestant_ratings
)
DELETE FROM contestant_ratings 
WHERE id IN (
  SELECT id FROM ranked_ratings WHERE rn > 1
);

-- Update ratings with proper user_id and participant_id links
UPDATE contestant_ratings 
SET 
  contestant_user_id = wcp.user_id, 
  participant_id = wcp.id
FROM weekly_contest_participants wcp 
WHERE TRIM(REGEXP_REPLACE(contestant_ratings.contestant_name, '\s+', ' ', 'g')) = 
      TRIM(REGEXP_REPLACE(CONCAT(wcp.application_data->>'first_name', ' ', wcp.application_data->>'last_name'), '\s+', ' ', 'g'))
AND contestant_ratings.contestant_user_id IS NULL;

-- Recreate the trigger if it existed (check the existing triggers)
CREATE OR REPLACE FUNCTION save_rating_history()
RETURNS TRIGGER AS $$
BEGIN
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
      0, -- Use 0 instead of NULL for deleted records
      'delete'
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
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
  ELSIF TG_OP = 'INSERT' THEN
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
      0, -- No old rating for new records
      NEW.rating,
      'insert'
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER save_rating_history_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON contestant_ratings
  FOR EACH ROW EXECUTE FUNCTION save_rating_history();

-- Update participant statistics
SELECT update_participant_rating_stats();