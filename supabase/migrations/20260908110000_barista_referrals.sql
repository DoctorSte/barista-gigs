-- Barista referral links: baristas share /r/<code> too; when a café signs up
-- through one and activates a subscription, the barista earns a cash bonus
-- (paid out manually to the payment details on their profile).

alter table public.extras_profiles
  add column referral_code text not null unique
    default substr(md5(gen_random_uuid()::text), 1, 10);

alter table public.coffee_shops
  add column referred_by_extra uuid references public.extras_profiles (id),
  add column extra_referral_bonus_granted boolean not null default false;

create table public.referral_bonuses (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  amount_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (shop_id)
);

alter table public.referral_bonuses enable row level security;

-- Baristas see their own bonuses; writes go through the service role.
create policy "baristas read own referral bonuses"
  on public.referral_bonuses for select
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = referral_bonuses.extra_id and ep.user_id = auth.uid()
    )
  );
