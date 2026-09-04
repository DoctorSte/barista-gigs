-- Per-user email notification preferences. In-app notifications are always
-- created; these toggles only gate emails. Missing row = all defaults (true).

create table public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_applications boolean not null default true,
  email_messages boolean not null default true,
  email_opportunities boolean not null default true,
  email_team boolean not null default true,
  email_referrals boolean not null default true,
  email_digest boolean not null default true,
  last_digest_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

create policy "users manage own notification prefs"
  on public.notification_prefs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
