-- Create function to auto-assign regular role when user votes in multiple weeks
CREATE OR REPLACE FUNCTION public.auto_assign_regular_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_unique_weeks INTEGER;
BEGIN
  -- Count unique week intervals for this user
  SELECT COUNT(DISTINCT week_interval)
  INTO user_unique_weeks
  FROM contestant_ratings
  WHERE user_id = NEW.user_id
    AND week_interval IS NOT NULL;
  
  -- If user has voted in 2+ different weeks, assign 'regular' role
  IF user_unique_weeks >= 2 THEN
    -- Insert regular role if not exists
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'regular')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Assigned regular role to user % (voted in % weeks)', NEW.user_id, user_unique_weeks;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign regular role
DROP TRIGGER IF EXISTS auto_assign_regular_role_trigger ON contestant_ratings;
CREATE TRIGGER auto_assign_regular_role_trigger
AFTER INSERT ON contestant_ratings
FOR EACH ROW
EXECUTE FUNCTION auto_assign_regular_role();

-- Assign regular role to all existing users who voted in 2+ weeks
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT user_id, 'regular'::app_role
FROM (
  SELECT user_id, COUNT(DISTINCT week_interval) as unique_weeks
  FROM contestant_ratings
  WHERE week_interval IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(DISTINCT week_interval) >= 2
) AS regular_voters
ON CONFLICT (user_id, role) DO NOTHING;