-- Allow public read of profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Create follow stats function (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_follow_stats(target_user_id uuid)
RETURNS TABLE(followers_count integer, following_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.follows f WHERE f.followee_id = target_user_id) AS followers_count,
    (SELECT count(*)::int FROM public.follows f WHERE f.follower_id = target_user_id) AS following_count;
$$;
REVOKE ALL ON FUNCTION public.get_follow_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_follow_stats(uuid) TO anon, authenticated;

-- Create is_following function using auth.uid()
CREATE OR REPLACE FUNCTION public.is_following(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.follows f
    WHERE f.follower_id = uid AND f.followee_id = target_user_id
  );
END;
$$;
REVOKE ALL ON FUNCTION public.is_following(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_following(uuid) TO anon, authenticated;

-- Seed a demo public profile for previewing another user's page
INSERT INTO public.profiles (id, display_name, city, country, height_cm, weight_kg, bio)
VALUES ('11111111-1111-1111-1111-111111111111', 'Name Chall', 'Negros', 'Philippines', 182, 53, 'Участвую в текущем голосовании. Спасибо за поддержку!')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  height_cm = EXCLUDED.height_cm,
  weight_kg = EXCLUDED.weight_kg,
  bio = EXCLUDED.bio;

-- Optional: Seed some follow relationships to show non-zero counts
INSERT INTO public.follows (follower_id, followee_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc')
ON CONFLICT DO NOTHING;