-- Trust loop: cafés confirm whether an accepted barista worked the shift
-- (completed / no_show), which unlocks two-way reviews. Reliability stats are
-- derived from these columns.

alter table public.interests
  add column work_status text check (work_status in ('completed', 'no_show')),
  add column work_status_at timestamptz;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid not null references public.interests (id) on delete cascade,
  author_role text not null check (author_role in ('shop', 'extra')),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (interest_id, author_role)
);

alter table public.reviews enable row level security;

-- Anyone signed in can read reviews (they appear on public profiles).
create policy "reviews readable by authenticated"
  on public.reviews for select
  to authenticated
  using (true);

-- The café team behind the gig writes shop reviews; the barista writes extra
-- reviews. Either way the shift must be marked completed first.
create policy "participants review completed shifts"
  on public.reviews for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.interests i
      join public.announcements a on a.id = i.announcement_id
      join public.coffee_shops cs on cs.id = a.shop_id
      join public.extras_profiles ep on ep.id = i.extra_id
      where i.id = reviews.interest_id
        and i.status = 'accepted'
        and i.work_status = 'completed'
        and (
          (reviews.author_role = 'shop' and public.same_cafe_team(cs.owner_id))
          or (reviews.author_role = 'extra' and ep.user_id = auth.uid())
        )
    )
  );
