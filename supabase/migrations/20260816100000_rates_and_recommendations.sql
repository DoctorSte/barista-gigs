-- Barista rate cards + fun profile fields, and shop → barista recommendations.

alter table public.extras_profiles
  add column rates jsonb not null default '[]'::jsonb,
  add column signature_drink text,
  add column instagram_handle text;

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  comment text,
  created_at timestamptz not null default now(),
  unique (shop_id, extra_id)
);

create index recommendations_extra_idx on public.recommendations (extra_id);

alter table public.recommendations enable row level security;

create policy "recommendations are readable"
  on public.recommendations for select
  to authenticated
  using (true);

-- A shop can only vouch for a barista it actually accepted for one of its gigs.
create policy "shops recommend baristas who worked for them"
  on public.recommendations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = recommendations.shop_id and cs.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.interests i
      join public.announcements a on a.id = i.announcement_id
      where a.shop_id = recommendations.shop_id
        and i.extra_id = recommendations.extra_id
        and i.status = 'accepted'
    )
  );

create policy "shops remove own recommendations"
  on public.recommendations for delete
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = recommendations.shop_id and cs.owner_id = auth.uid()
    )
  );
