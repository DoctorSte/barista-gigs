-- Café planner: an internal staff roster and internal shifts, scheduled on the
-- planner grid alongside marketplace gigs. Staff may not be on the platform at
-- all — these rows never touch the application flow.

create table public.cafe_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.planner_shifts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  staff_id uuid not null references public.cafe_staff (id) on delete cascade,
  date date not null,
  -- Minutes from midnight; end_min <= start_min means the shift runs past
  -- midnight, mirroring gig shift semantics.
  start_min int not null check (start_min >= 0 and start_min < 1440),
  end_min int not null check (end_min > 0 and end_min <= 1440),
  note text,
  created_at timestamptz not null default now()
);

create index planner_shifts_shop_date on public.planner_shifts (shop_id, date);

alter table public.cafe_staff enable row level security;
alter table public.planner_shifts enable row level security;

create policy "cafe team manages staff"
  on public.cafe_staff for all
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = cafe_staff.shop_id and public.same_cafe_team(cs.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = cafe_staff.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

create policy "cafe team manages planner shifts"
  on public.planner_shifts for all
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = planner_shifts.shop_id and public.same_cafe_team(cs.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = planner_shifts.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );
