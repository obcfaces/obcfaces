-- Grant execute permission to public/anonymous users for the function
GRANT EXECUTE ON FUNCTION public.get_weekly_contest_participants_public(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_contest_participants_public(integer) TO authenticated;