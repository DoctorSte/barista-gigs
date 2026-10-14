-- Tracks the "finish your profile" nudges sent to baristas so the daily cron
-- sends at most two (a few days after signup, then once more two weeks in)
-- and stops as soon as the profile is complete. Written only by the service
-- role — RLS on, no policies.

create table public.profile_reminders (
  extra_id uuid primary key references public.extras_profiles (id) on delete cascade,
  sent_count integer not null default 0,
  last_sent_at timestamptz not null default now()
);

alter table public.profile_reminders enable row level security;
