-- Fix the handle_new_user trigger to not insert email column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, country, state, city)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'country',
    new.raw_user_meta_data ->> 'state', 
    new.raw_user_meta_data ->> 'city'
  );
  RETURN new;
END;
$$;