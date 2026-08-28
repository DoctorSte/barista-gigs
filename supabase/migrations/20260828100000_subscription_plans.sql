-- Three-tier plans. Existing subscriptions map to "regular" (the old single plan).
alter table public.subscriptions
  add column plan text not null default 'regular'
    check (plan in ('occasional', 'regular', 'group')),
  add column billing_interval text
    check (billing_interval in ('monthly', 'yearly'));
