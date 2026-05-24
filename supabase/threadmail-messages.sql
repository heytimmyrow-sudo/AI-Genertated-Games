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

alter table public.threadmail_messages
  drop constraint if exists threadmail_messages_body_check;

alter table public.threadmail_messages
  add constraint threadmail_messages_body_check
  check (char_length(body) between 1 and 1200000);

create table if not exists public.threadmail_handles (
  handle text primary key check (handle ~ '^[a-z0-9_]{3,24}$'),
  owner_token text not null check (char_length(owner_token) between 24 and 80),
  code_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.threadmail_handles
  add column if not exists code_hash text;

alter table public.threadmail_handles enable row level security;

drop policy if exists "threadmail handles public read" on public.threadmail_handles;
create policy "threadmail handles public read"
on public.threadmail_handles
for select
to anon
using (false);

drop policy if exists "threadmail handles public reserve" on public.threadmail_handles;
create policy "threadmail handles public reserve"
on public.threadmail_handles
for insert
to anon
with check (false);

drop policy if exists "threadmail handles owner update" on public.threadmail_handles;
create policy "threadmail handles owner update"
on public.threadmail_handles
for update
to anon
using (false)
with check (false);

create or replace function public.threadmail_claim_handle(
  p_handle text,
  p_owner_token text,
  p_code_hash text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.threadmail_handles;
  reserved_names text[] := array[
    'admin',
    'administrator',
    'ari',
    'help',
    'moderator',
    'official',
    'root',
    'security',
    'staff',
    'support',
    'system',
    'thread_ai',
    'threadai',
    'threadmail',
    'tm'
  ];
begin
  p_handle := lower(trim(p_handle));
  p_code_hash := nullif(trim(coalesce(p_code_hash, '')), '');

  if p_handle !~ '^[a-z0-9_]{3,24}$' then
    return 'invalid';
  end if;

  if p_handle = any(reserved_names) or p_handle like 'threadmail_%' or p_handle like 'support_%' then
    return 'reserved';
  end if;

  if p_owner_token is null or char_length(p_owner_token) < 24 or char_length(p_owner_token) > 80 then
    return 'invalid_owner';
  end if;

  select * into existing
  from public.threadmail_handles
  where handle = p_handle
  for update;

  if not found then
    insert into public.threadmail_handles (handle, owner_token, code_hash)
    values (p_handle, p_owner_token, p_code_hash);
    return case when p_code_hash is null then 'claimed_unprotected' else 'claimed' end;
  end if;

  if existing.owner_token = p_owner_token then
    update public.threadmail_handles
    set code_hash = coalesce(p_code_hash, code_hash),
        updated_at = timezone('utc', now())
    where handle = p_handle;
    return case when coalesce(p_code_hash, existing.code_hash) is null then 'owned_unprotected' else 'owned' end;
  end if;

  if existing.code_hash is not null and p_code_hash is not null and existing.code_hash = p_code_hash then
    update public.threadmail_handles
    set owner_token = p_owner_token,
        updated_at = timezone('utc', now())
    where handle = p_handle;
    return 'unlocked';
  end if;

  if existing.code_hash is null then
    return 'taken_unprotected';
  end if;

  return 'locked';
end;
$$;

grant execute on function public.threadmail_claim_handle(text, text, text) to anon;

create table if not exists public.threadmail_games (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'tic_tac_toe' check (type in ('tic_tac_toe','connect_four','battleship','word_chain')),
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

alter table public.threadmail_games
  drop constraint if exists threadmail_games_type_check;

alter table public.threadmail_games
  add constraint threadmail_games_type_check
  check (type in ('tic_tac_toe','connect_four','battleship','word_chain'));

create table if not exists public.threadmail_typing (
  sender_handle text not null check (sender_handle ~ '^[a-z0-9_]{3,24}$'),
  recipient_handle text not null check (recipient_handle ~ '^[a-z0-9_]{3,24}$'),
  subject_key text not null check (char_length(subject_key) between 1 and 140),
  is_typing boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (sender_handle, recipient_handle, subject_key)
);

alter table public.threadmail_typing enable row level security;

drop policy if exists "threadmail typing public read" on public.threadmail_typing;
create policy "threadmail typing public read"
on public.threadmail_typing
for select
to anon
using (true);

drop policy if exists "threadmail typing public upsert" on public.threadmail_typing;
create policy "threadmail typing public upsert"
on public.threadmail_typing
for insert
to anon
with check (true);

drop policy if exists "threadmail typing public update" on public.threadmail_typing;
create policy "threadmail typing public update"
on public.threadmail_typing
for update
to anon
using (true)
with check (true);

create index if not exists threadmail_typing_recipient_idx
  on public.threadmail_typing (recipient_handle, updated_at desc);

create table if not exists public.threadmail_calls (
  id uuid primary key default gen_random_uuid(),
  call_type text not null default 'voice' check (call_type in ('voice','video')),
  caller_handle text not null check (caller_handle ~ '^[a-z0-9_]{3,24}$'),
  callee_handle text not null check (callee_handle ~ '^[a-z0-9_]{3,24}$'),
  status text not null default 'ringing' check (status in ('ringing','accepted','declined','ended')),
  offer jsonb,
  answer jsonb,
  caller_candidates jsonb not null default '[]'::jsonb,
  callee_candidates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.threadmail_calls enable row level security;

drop policy if exists "threadmail calls public read" on public.threadmail_calls;
create policy "threadmail calls public read"
on public.threadmail_calls
for select
to anon
using (true);

drop policy if exists "threadmail calls public create" on public.threadmail_calls;
create policy "threadmail calls public create"
on public.threadmail_calls
for insert
to anon
with check (true);

drop policy if exists "threadmail calls public update" on public.threadmail_calls;
create policy "threadmail calls public update"
on public.threadmail_calls
for update
to anon
using (true)
with check (true);

create index if not exists threadmail_calls_callee_idx
  on public.threadmail_calls (callee_handle, updated_at desc);

create index if not exists threadmail_calls_caller_idx
  on public.threadmail_calls (caller_handle, updated_at desc);

alter table public.threadmail_calls
  add column if not exists call_type text not null default 'voice';

alter table public.threadmail_calls
  drop constraint if exists threadmail_calls_call_type_check;

alter table public.threadmail_calls
  add constraint threadmail_calls_call_type_check
  check (call_type in ('voice','video'));
