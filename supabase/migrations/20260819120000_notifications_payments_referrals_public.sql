-- Foundation for: in-app notifications, barista payment details,
-- café referral links, and public (logged-out) gig browsing.

-- --- Notifications -----------------------------------------------------------
-- Inserted by the server with the service role only (no insert policy);
-- recipients read and mark their own.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users read own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "users update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --- Barista payment details -------------------------------------------------
-- Kept out of extras_profiles so city-wide profile reads never expose it.
-- Readable only by the barista and shops that accepted them for a gig.
create table public.extras_payment_details (
  extra_id uuid primary key references public.extras_profiles (id) on delete cascade,
  details text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.extras_payment_details enable row level security;

create policy "payment details readable by owner and hiring shops"
  on public.extras_payment_details for select
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = extras_payment_details.extra_id and ep.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.interests i
      join public.announcements a on a.id = i.announcement_id
      join public.coffee_shops cs on cs.id = a.shop_id
      where i.extra_id = extras_payment_details.extra_id
        and i.status = 'accepted'
        and cs.owner_id = auth.uid()
    )
  );

create policy "extras insert own payment details"
  on public.extras_payment_details for insert
  to authenticated
  with check (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = extras_payment_details.extra_id and ep.user_id = auth.uid()
    )
  );

create policy "extras update own payment details"
  on public.extras_payment_details for update
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = extras_payment_details.extra_id and ep.user_id = auth.uid()
    )
  );

-- --- Café referral links -----------------------------------------------------
alter table public.coffee_shops
  add column referral_code text not null unique
    default substr(md5(gen_random_uuid()::text), 1, 10),
  add column referred_by uuid references public.coffee_shops (id);

-- --- Public browsing ---------------------------------------------------------
create policy "open announcements are publicly readable"
  on public.announcements for select
  to anon
  using (status = 'open');

create policy "published shops are publicly readable"
  on public.coffee_shops for select
  to anon
  using (is_published = true);
