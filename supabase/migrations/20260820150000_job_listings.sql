-- Cafés can also post full- or part-time positions. Jobs reuse announcements:
-- kind != 'shift' means no shift dates (starts_at/ends_at hold the listing's
-- visibility window instead) and optional weekly hours; pay can be monthly.

alter table public.announcements
  add column kind text not null default 'shift'
    check (kind in ('shift', 'full_time', 'part_time')),
  add column weekly_hours integer;

alter table public.announcements drop constraint announcements_pay_type_check;
alter table public.announcements add constraint announcements_pay_type_check
  check (pay_type in ('hourly', 'flat', 'monthly'));
