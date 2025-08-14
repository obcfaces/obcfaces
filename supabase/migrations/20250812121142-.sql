-- Create follows table to support subscriptions
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

-- Indexes for faster counts/queries
create index if not exists idx_follows_followee on public.follows(followee_id);
create index if not exists idx_follows_follower on public.follows(follower_id);

-- Enable RLS
alter table public.follows enable row level security;

-- Policies
-- 1) Anyone (including anon) can read follows to allow public counts
create policy "Anyone can view follows"
  on public.follows
  for select
  to public
  using (true);

-- 2) Only the authenticated user can follow others (insert)
create policy "Users can follow others"
  on public.follows
  for insert
  to authenticated
  with check (
    auth.uid() = follower_id
    and follower_id <> followee_id
  );

-- 3) Only the follower can unfollow (delete)
create policy "Users can unfollow others"
  on public.follows
  for delete
  to authenticated
  using (auth.uid() = follower_id);

-- No UPDATE policy -> updates are not allowed (immutability)

-- Add bio field to profiles for "about me" text
alter table public.profiles add column if not exists bio text;