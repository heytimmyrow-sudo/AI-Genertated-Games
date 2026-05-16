create table if not exists public.threadmail_messages (
  id uuid primary key default gen_random_uuid(),
  sender_handle text not null check (sender_handle ~ '^[a-z0-9_]{3,24}$'),
  recipient_handle text not null check (recipient_handle ~ '^[a-z0-9_]{3,24}$'),
  subject text not null check (char_length(subject) between 1 and 140),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

alter table public.threadmail_messages enable row level security;

drop policy if exists "threadmail public read" on public.threadmail_messages;
create policy "threadmail public read"
on public.threadmail_messages
for select
to anon
using (true);

drop policy if exists "threadmail public send" on public.threadmail_messages;
create policy "threadmail public send"
on public.threadmail_messages
for insert
to anon
with check (true);

drop policy if exists "threadmail public update" on public.threadmail_messages;
create policy "threadmail public update"
on public.threadmail_messages
for update
to anon
using (true)
with check (true);

drop policy if exists "threadmail public delete" on public.threadmail_messages;
create policy "threadmail public delete"
on public.threadmail_messages
for delete
to anon
using (true);

create index if not exists threadmail_recipient_idx
  on public.threadmail_messages (recipient_handle, created_at desc);

create index if not exists threadmail_sender_idx
  on public.threadmail_messages (sender_handle, created_at desc);

alter table public.threadmail_messages
  add column if not exists game_id uuid;

create table if not exists public.threadmail_handles (
  handle text primary key check (handle ~ '^[a-z0-9_]{3,24}$'),
  owner_token text not null check (char_length(owner_token) between 24 and 80),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.threadmail_handles enable row level security;

drop policy if exists "threadmail handles public read" on public.threadmail_handles;
create policy "threadmail handles public read"
on public.threadmail_handles
for select
to anon
using (true);

drop policy if exists "threadmail handles public reserve" on public.threadmail_handles;
create policy "threadmail handles public reserve"
on public.threadmail_handles
for insert
to anon
with check (true);

drop policy if exists "threadmail handles owner update" on public.threadmail_handles;
create policy "threadmail handles owner update"
on public.threadmail_handles
for update
to anon
using (true)
with check (true);

create table if not exists public.threadmail_games (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'tic_tac_toe' check (type in ('tic_tac_toe')),
  x_handle text not null check (x_handle ~ '^[a-z0-9_]{3,24}$'),
  o_handle text not null check (o_handle ~ '^[a-z0-9_]{3,24}$'),
  board jsonb not null default '["","","","","","","","",""]'::jsonb,
  turn_handle text not null check (turn_handle ~ '^[a-z0-9_]{3,24}$'),
  status text not null default 'active' check (status in ('active','x_won','o_won','draw')),
  last_message_id uuid references public.threadmail_messages(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.threadmail_games enable row level security;

drop policy if exists "threadmail games public read" on public.threadmail_games;
create policy "threadmail games public read"
on public.threadmail_games
for select
to anon
using (true);

drop policy if exists "threadmail games public create" on public.threadmail_games;
create policy "threadmail games public create"
on public.threadmail_games
for insert
to anon
with check (true);

drop policy if exists "threadmail games public update" on public.threadmail_games;
create policy "threadmail games public update"
on public.threadmail_games
for update
to anon
using (true)
with check (true);

create index if not exists threadmail_games_x_idx
  on public.threadmail_games (x_handle, updated_at desc);

create index if not exists threadmail_games_o_idx
  on public.threadmail_games (o_handle, updated_at desc);
