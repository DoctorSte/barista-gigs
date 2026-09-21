-- Staff become first-class: contracted weekly hours, a default weekly
-- schedule, and an optional link to a real barista account (via invite, so
-- the barista consents). Linked baristas can read their own rota and mark
-- days off, which the planner surfaces to the café.

alter table public.cafe_staff
  add column weekly_hours_target int
    check (weekly_hours_target > 0 and weekly_hours_target <= 80),
  -- Default weekly schedule: [{ day: 0-6 (Mon-first), start: "HH:MM", end: "HH:MM" }]
  add column default_week jsonb not null default '[]'::jsonb,
  add column user_id uuid references public.profiles (id) on delete set null,
  add column invite_email text,
  add column invite_token text unique;

create table public.staff_time_off (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  staff_id uuid not null references public.cafe_staff (id) on delete cascade,
  date date not null,
  note text,
  created_at timestamptz not null default now(),
  unique (staff_id, date)
);

create index staff_time_off_shop_date on public.staff_time_off (shop_id, date);

alter table public.staff_time_off enable row level security;

create policy "cafe team manages staff time off"
  on public.staff_time_off for all
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = staff_time_off.shop_id and public.same_cafe_team(cs.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = staff_time_off.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

-- A linked barista sees their own staff rows, their own shifts, and manages
-- their own time off. Linking itself goes through the invite token (service
-- role), so a barista can never attach themselves to a café uninvited.
create policy "linked barista reads own staff row"
  on public.cafe_staff for select
  to authenticated
  using (user_id = auth.uid());

create policy "linked barista reads own planner shifts"
  on public.planner_shifts for select
  to authenticated
  using (
    exists (
      select 1 from public.cafe_staff st
      where st.id = planner_shifts.staff_id and st.user_id = auth.uid()
    )
  );

create policy "linked barista manages own time off"
  on public.staff_time_off for all
  to authenticated
  using (
    exists (
      select 1 from public.cafe_staff st
      where st.id = staff_time_off.staff_id
        and st.shop_id = staff_time_off.shop_id
        and st.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cafe_staff st
      where st.id = staff_time_off.staff_id
        and st.shop_id = staff_time_off.shop_id
        and st.user_id = auth.uid()
    )
  );
