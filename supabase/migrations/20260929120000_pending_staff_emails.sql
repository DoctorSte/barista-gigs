-- Debounce marker for "your staff changed their availability" emails: one row
-- per staff member while an email is scheduled, so toggling days off five
-- times in ten minutes produces one email, not five. Written only by the
-- service role — RLS on, no policies.

create table public.pending_staff_emails (
  staff_id uuid primary key references public.cafe_staff (id) on delete cascade,
  send_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.pending_staff_emails enable row level security;
