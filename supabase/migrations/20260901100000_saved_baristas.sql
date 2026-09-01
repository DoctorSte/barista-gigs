-- Saved/favourite baristas, per café location.
create table public.saved_baristas (
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shop_id, extra_id)
);

alter table public.saved_baristas enable row level security;

create policy "shop owners manage saved baristas"
  on public.saved_baristas for all
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = saved_baristas.shop_id and cs.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = saved_baristas.shop_id and cs.owner_id = auth.uid()
    )
  );
