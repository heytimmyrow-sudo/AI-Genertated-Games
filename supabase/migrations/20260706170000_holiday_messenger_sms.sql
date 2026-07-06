create table if not exists public.holiday_messenger_sms (
  id uuid primary key default gen_random_uuid(),
  holiday_name text not null default 'Scheduled message',
  to_phone text not null,
  body text not null,
  send_at timestamptz not null,
  status text not null default 'scheduled',
  twilio_sid text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists holiday_messenger_sms_due_idx
  on public.holiday_messenger_sms (send_at)
  where status = 'scheduled';

alter table public.holiday_messenger_sms enable row level security;
