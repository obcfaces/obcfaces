drop policy if exists "Profiles are viewable by everyone" on public.profiles;

create policy "Profiles are viewable by everyone"
on public.profiles
for select
to public
using (true);
