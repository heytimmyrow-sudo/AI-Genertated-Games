create table if not exists public.math_masters_leaderboard (
  account_id text primary key,
  display_name text not null check (char_length(display_name) between 1 and 18),
  medal text not null,
  xp integer not null default 0 check (xp >= 0),
  challenge_clears integer not null default 0 check (challenge_clears >= 0),
  mastery integer not null default 0 check (mastery between 0 and 100),
  grade_path text not null default '7th Accelerated',
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.math_masters_leaderboard enable row level security;

drop policy if exists "public leaderboard read" on public.math_masters_leaderboard;
create policy "public leaderboard read"
on public.math_masters_leaderboard
for select
to anon
using (true);

drop policy if exists "public leaderboard upsert" on public.math_masters_leaderboard;
create policy "public leaderboard upsert"
on public.math_masters_leaderboard
for insert
to anon
with check (true);

drop policy if exists "public leaderboard update" on public.math_masters_leaderboard;
create policy "public leaderboard update"
on public.math_masters_leaderboard
for update
to anon
using (true)
with check (true);

create index if not exists math_masters_leaderboard_rank_idx
  on public.math_masters_leaderboard (xp desc, mastery desc, updated_at asc);
