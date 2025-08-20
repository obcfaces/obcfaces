-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.get_contestant_average_rating(contestant_name_param TEXT, contestant_user_id_param UUID DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,1)
  FROM public.contestant_ratings 
  WHERE contestant_name = contestant_name_param 
    AND (contestant_user_id_param IS NULL OR contestant_user_id = contestant_user_id_param);
$$;