create extension if not exists pgcrypto;

create table if not exists public.pulse_league_profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 24),
  owner_token text not null check (char_length(owner_token) between 24 and 120),
  cosmetic text not null default 'rookie-pass',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pulse_league_connections (
  owner_profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  target_profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  relation text not null check (relation in ('Friend', 'Family')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (owner_profile_id, target_profile_id),
  check (owner_profile_id <> target_profile_id)
);

create table if not exists public.pulse_league_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  activity text not null check (char_length(activity) between 1 and 32),
  minutes integer not null check (minutes >= 5 and minutes <= 600),
  note text not null default '' check (char_length(note) <= 120),
  points integer generated always as (minutes * 10) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.pulse_league_profiles enable row level security;
alter table public.pulse_league_connections enable row level security;
alter table public.pulse_league_sessions enable row level security;

alter table public.pulse_league_profiles
  add column if not exists coins integer not null default 0 check (coins >= 0),
  add column if not exists recovery_code text,
  add column if not exists proof_required boolean not null default false;

create table if not exists public.pulse_league_friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  relation text not null default 'Friend' check (relation in ('Friend', 'Family')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (sender_profile_id, recipient_profile_id)
);

create table if not exists public.pulse_league_groups (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique,
  team_name text not null default 'Pulse Team',
  private boolean not null default true,
  coach_challenge text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pulse_league_group_members (
  group_id uuid not null references public.pulse_league_groups(id) on delete cascade,
  profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'coach', 'member')),
  primary key (group_id, profile_id)
);

create table if not exists public.pulse_league_prizes (
  profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  prize_id text not null,
  purchased_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, prize_id)
);

create table if not exists public.pulse_league_blocks (
  blocker_profile_id uuid not null references public.pulse_league_profiles(id) on delete cascade,
  blocked_username text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_profile_id, blocked_username)
);

alter table public.pulse_league_friend_requests enable row level security;
alter table public.pulse_league_groups enable row level security;
alter table public.pulse_league_group_members enable row level security;
alter table public.pulse_league_prizes enable row level security;
alter table public.pulse_league_blocks enable row level security;

drop policy if exists "pulse league profiles locked" on public.pulse_league_profiles;
create policy "pulse league profiles locked"
on public.pulse_league_profiles
for all
to anon
using (false)
with check (false);

drop policy if exists "pulse league connections locked" on public.pulse_league_connections;
create policy "pulse league connections locked"
on public.pulse_league_connections
for all
to anon
using (false)
with check (false);

drop policy if exists "pulse league sessions locked" on public.pulse_league_sessions;
create policy "pulse league sessions locked"
on public.pulse_league_sessions
for all
to anon
using (false)
with check (false);

create index if not exists pulse_league_sessions_profile_created_idx
  on public.pulse_league_sessions (profile_id, created_at desc);

create index if not exists pulse_league_connections_owner_idx
  on public.pulse_league_connections (owner_profile_id);

alter table public.pulse_league_sessions
  add column if not exists proof text not null default '' check (char_length(proof) <= 160),
  add column if not exists flagged boolean not null default false;

create or replace function public.pulse_league_profile_json(p_profile public.pulse_league_profiles)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', p_profile.id,
    'username', p_profile.username,
    'display_name', p_profile.display_name,
    'cosmetic', p_profile.cosmetic,
    'coins', p_profile.coins,
    'proof_required', p_profile.proof_required
  );
$$;

create or replace function public.pulse_league_claim_profile(
  p_username text,
  p_display_name text,
  p_owner_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.pulse_league_profiles;
  saved public.pulse_league_profiles;
  reserved_names text[] := array['admin', 'administrator', 'help', 'moderator', 'official', 'root', 'staff', 'support', 'system', 'pulseleague', 'pulse_league'];
begin
  p_username := lower(trim(coalesce(p_username, '')));
  p_display_name := trim(coalesce(p_display_name, ''));

  if p_username !~ '^[a-z0-9_]{3,24}$' or char_length(p_owner_token) < 24 or char_length(p_owner_token) > 120 then
    return jsonb_build_object('status', 'invalid');
  end if;

  if p_username = any(reserved_names) or p_username like 'admin_%' or p_username like 'support_%' then
    return jsonb_build_object('status', 'reserved');
  end if;

  if p_display_name = '' then
    p_display_name := p_username;
  end if;

  select * into existing
  from public.pulse_league_profiles
  where username = p_username
  for update;

  if found and existing.owner_token <> p_owner_token then
    return jsonb_build_object('status', 'taken');
  end if;

  if found then
    update public.pulse_league_profiles
    set display_name = left(p_display_name, 24),
        updated_at = timezone('utc', now())
    where id = existing.id
    returning * into saved;

    return jsonb_build_object('status', 'owned', 'profile', public.pulse_league_profile_json(saved));
  end if;

  insert into public.pulse_league_profiles (username, display_name, owner_token)
  values (p_username, left(p_display_name, 24), p_owner_token)
  returning * into saved;

  return jsonb_build_object('status', 'claimed', 'profile', public.pulse_league_profile_json(saved));
end;
$$;

create or replace function public.pulse_league_update_profile(
  p_profile_id uuid,
  p_owner_token text,
  p_display_name text,
  p_cosmetic text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.pulse_league_profiles;
begin
  update public.pulse_league_profiles
  set display_name = coalesce(left(nullif(trim(coalesce(p_display_name, '')), ''), 24), display_name),
      cosmetic = coalesce(nullif(trim(p_cosmetic), ''), cosmetic),
      updated_at = timezone('utc', now())
  where id = p_profile_id
    and owner_token = p_owner_token
  returning * into saved;

  if not found then
    return jsonb_build_object('status', 'denied');
  end if;

  return jsonb_build_object('status', 'updated', 'profile', public.pulse_league_profile_json(saved));
end;
$$;

create or replace function public.pulse_league_add_connection(
  p_owner_profile_id uuid,
  p_owner_token text,
  p_target_username text,
  p_relation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_row public.pulse_league_profiles;
  target_row public.pulse_league_profiles;
begin
  p_target_username := lower(trim(coalesce(p_target_username, '')));
  p_relation := case when p_relation = 'Family' then 'Family' else 'Friend' end;

  select * into owner_row
  from public.pulse_league_profiles
  where id = p_owner_profile_id and owner_token = p_owner_token;

  if not found then
    return jsonb_build_object('status', 'denied');
  end if;

  select * into target_row
  from public.pulse_league_profiles
  where username = p_target_username;

  if not found then
    return jsonb_build_object('status', 'missing');
  end if;

  if target_row.id = owner_row.id then
    return jsonb_build_object('status', 'self');
  end if;

  insert into public.pulse_league_connections (owner_profile_id, target_profile_id, relation)
  values (owner_row.id, target_row.id, p_relation)
  on conflict (owner_profile_id, target_profile_id)
  do update set relation = excluded.relation;

  return jsonb_build_object('status', 'added', 'profile', public.pulse_league_profile_json(target_row));
end;
$$;

create or replace function public.pulse_league_remove_connection(
  p_owner_profile_id uuid,
  p_owner_token text,
  p_target_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.pulse_league_profiles
    where id = p_owner_profile_id and owner_token = p_owner_token
  ) then
    return jsonb_build_object('status', 'denied');
  end if;

  delete from public.pulse_league_connections
  where owner_profile_id = p_owner_profile_id
    and target_profile_id = p_target_profile_id;

  return jsonb_build_object('status', 'removed');
end;
$$;

create or replace function public.pulse_league_log_session(
  p_profile_id uuid,
  p_owner_token text,
  p_activity text,
  p_minutes integer,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.pulse_league_sessions;
begin
  if not exists (
    select 1 from public.pulse_league_profiles
    where id = p_profile_id and owner_token = p_owner_token
  ) then
    return jsonb_build_object('status', 'denied');
  end if;

  insert into public.pulse_league_sessions (profile_id, activity, minutes, note, flagged)
  values (
    p_profile_id,
    left(trim(coalesce(p_activity, 'Other')), 32),
    greatest(5, least(600, p_minutes)),
    left(coalesce(p_note, ''), 120),
    p_minutes > 180 or coalesce(p_note, '') ~* '(fake|cheat|not real)'
  )
  returning * into saved;

  if not saved.flagged then
    update public.pulse_league_profiles
    set coins = coins + greatest(1, round(saved.minutes / 5.0)::integer)
    where id = p_profile_id;
  end if;

  return jsonb_build_object('status', 'logged', 'session', to_jsonb(saved));
end;
$$;

create or replace function public.pulse_league_update_session(
  p_session_id uuid,
  p_owner_token text,
  p_activity text,
  p_minutes integer,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.pulse_league_sessions;
begin
  update public.pulse_league_sessions s
  set activity = left(trim(coalesce(p_activity, 'Other')), 32),
      minutes = greatest(5, least(600, p_minutes)),
      note = left(coalesce(p_note, ''), 120),
      updated_at = timezone('utc', now())
  from public.pulse_league_profiles p
  where s.id = p_session_id
    and s.profile_id = p.id
    and p.owner_token = p_owner_token
  returning s.* into saved;

  if not found then
    return jsonb_build_object('status', 'denied');
  end if;

  return jsonb_build_object('status', 'updated', 'session', to_jsonb(saved));
end;
$$;

create or replace function public.pulse_league_delete_session(
  p_session_id uuid,
  p_owner_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.pulse_league_sessions s
  using public.pulse_league_profiles p
  where s.id = p_session_id
    and s.profile_id = p.id
    and p.owner_token = p_owner_token;

  return jsonb_build_object('status', 'deleted');
end;
$$;

create or replace function public.pulse_league_get_league(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_ids uuid[];
begin
  select array_agg(id) into profile_ids
  from (
    select p_profile_id as id
    union
    select target_profile_id
    from public.pulse_league_connections
    where owner_profile_id = p_profile_id
  ) ids;

  return jsonb_build_object(
    'profiles',
    coalesce((
      select jsonb_agg(
        public.pulse_league_profile_json(p) ||
        jsonb_build_object('relation', coalesce(c.relation, 'Self'))
        order by case when p.id = p_profile_id then 0 else 1 end, p.display_name
      )
      from public.pulse_league_profiles p
      left join public.pulse_league_connections c
        on c.owner_profile_id = p_profile_id
       and c.target_profile_id = p.id
      where p.id = any(profile_ids)
    ), '[]'::jsonb),
    'sessions',
    coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at desc)
      from public.pulse_league_sessions s
      where s.profile_id = any(profile_ids)
        and s.created_at >= timezone('utc', now()) - interval '90 days'
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.pulse_league_send_friend_request(
  p_sender_profile_id uuid,
  p_owner_token text,
  p_target_username text,
  p_relation text default 'Friend'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_row public.pulse_league_profiles;
begin
  if not exists (
    select 1 from public.pulse_league_profiles
    where id = p_sender_profile_id and owner_token = p_owner_token
  ) then
    return jsonb_build_object('status', 'denied');
  end if;

  select * into target_row
  from public.pulse_league_profiles
  where username = lower(trim(p_target_username));

  if not found then
    return jsonb_build_object('status', 'missing');
  end if;

  insert into public.pulse_league_friend_requests (sender_profile_id, recipient_profile_id, relation)
  values (p_sender_profile_id, target_row.id, case when p_relation = 'Family' then 'Family' else 'Friend' end)
  on conflict (sender_profile_id, recipient_profile_id)
  do update set status = 'pending', relation = excluded.relation;

  return jsonb_build_object('status', 'sent', 'profile', public.pulse_league_profile_json(target_row));
end;
$$;

create or replace function public.pulse_league_buy_prize(
  p_profile_id uuid,
  p_owner_token text,
  p_prize_id text,
  p_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.pulse_league_profiles;
begin
  update public.pulse_league_profiles
  set coins = coins - greatest(0, p_cost)
  where id = p_profile_id
    and owner_token = p_owner_token
    and coins >= greatest(0, p_cost)
  returning * into saved;

  if not found then
    return jsonb_build_object('status', 'denied');
  end if;

  insert into public.pulse_league_prizes (profile_id, prize_id)
  values (p_profile_id, p_prize_id)
  on conflict do nothing;

  return jsonb_build_object('status', 'bought', 'profile', public.pulse_league_profile_json(saved));
end;
$$;

grant execute on function public.pulse_league_claim_profile(text, text, text) to anon;
grant execute on function public.pulse_league_update_profile(uuid, text, text, text) to anon;
grant execute on function public.pulse_league_add_connection(uuid, text, text, text) to anon;
grant execute on function public.pulse_league_remove_connection(uuid, text, uuid) to anon;
grant execute on function public.pulse_league_log_session(uuid, text, text, integer, text) to anon;
grant execute on function public.pulse_league_update_session(uuid, text, text, integer, text) to anon;
grant execute on function public.pulse_league_delete_session(uuid, text) to anon;
grant execute on function public.pulse_league_get_league(uuid) to anon;
grant execute on function public.pulse_league_send_friend_request(uuid, text, text, text) to anon;
grant execute on function public.pulse_league_buy_prize(uuid, text, text, integer) to anon;
