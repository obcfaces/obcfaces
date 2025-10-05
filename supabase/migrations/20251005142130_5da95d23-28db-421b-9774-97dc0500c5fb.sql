-- Create function to remove suspicious user's ratings
CREATE OR REPLACE FUNCTION public.remove_suspicious_user_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act on suspicious role assignment
  IF NEW.role = 'suspicious' THEN
    -- Delete all ratings by this user
    DELETE FROM contestant_ratings
    WHERE user_id = NEW.user_id;
    
    RAISE NOTICE 'Removed all ratings for suspicious user: %', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles insert
DROP TRIGGER IF EXISTS on_suspicious_role_assigned ON user_roles;
CREATE TRIGGER on_suspicious_role_assigned
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION remove_suspicious_user_ratings();