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
