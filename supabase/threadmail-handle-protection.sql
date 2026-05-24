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
