-- Barista Gigs initial schema

create extension if not exists "pgcrypto";

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text not null default 'FR',
  timezone text not null default 'Europe/Paris',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('shop', 'extra')),
  display_name text not null,
  city_id uuid not null references public.cities (id),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.coffee_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  city_id uuid not null references public.cities (id),
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  machines text[] not null default '{}',
  description text,
  website text,
  phone text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.extras_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  city_id uuid not null references public.cities (id),
  bio text,
  years_experience integer,
  hourly_rate_cents integer,
  currency text not null default 'EUR',
  availability jsonb not null default '{"weekly":[],"blackoutDates":[]}'::jsonb,
  skills text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_photos (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  city_id uuid not null references public.cities (id),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  pay_rate_cents integer not null,
  pay_type text not null check (pay_type in ('hourly', 'flat')),
  required_skills text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'open', 'filled', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  shop_id uuid primary key references public.coffee_shops (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (announcement_id, extra_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  shop_id uuid not null references public.coffee_shops (id) on delete cascade,
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (announcement_id, extra_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index announcements_city_status_idx on public.announcements (city_id, status, starts_at);
create index extras_profiles_city_available_idx on public.extras_profiles (city_id, is_available);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.coffee_shops enable row level security;
alter table public.extras_profiles enable row level security;
alter table public.portfolio_photos enable row level security;
alter table public.announcements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.interests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "cities are readable by everyone"
  on public.cities for select
  using (is_active = true);

create policy "profiles are readable in same city"
  on public.profiles for select
  to authenticated
  using (
    city_id = (
      select city_id from public.profiles p where p.id = auth.uid()
    )
    or id = auth.uid()
  );

create policy "users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "published shops readable in city"
  on public.coffee_shops for select
  to authenticated
  using (
    is_published = true
    and city_id = (select city_id from public.profiles where id = auth.uid())
    or owner_id = auth.uid()
  );

create policy "shop owners manage own shop"
  on public.coffee_shops for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "shop owners update own shop"
  on public.coffee_shops for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "available extras readable in city"
  on public.extras_profiles for select
  to authenticated
  using (
    city_id = (select city_id from public.profiles where id = auth.uid())
    or user_id = auth.uid()
  );

create policy "extras manage own profile"
  on public.extras_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "extras update own profile"
  on public.extras_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "portfolio readable in city"
  on public.portfolio_photos for select
  to authenticated
  using (
    exists (
      select 1
      from public.extras_profiles ep
      join public.profiles p on p.id = ep.user_id
      where ep.id = portfolio_photos.extra_id
        and ep.city_id = (select city_id from public.profiles where id = auth.uid())
    )
    or exists (
      select 1 from public.extras_profiles ep
      where ep.id = portfolio_photos.extra_id and ep.user_id = auth.uid()
    )
  );

create policy "extras manage portfolio"
  on public.portfolio_photos for all
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = portfolio_photos.extra_id and ep.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = portfolio_photos.extra_id and ep.user_id = auth.uid()
    )
  );

create policy "open announcements readable in city"
  on public.announcements for select
  to authenticated
  using (
    status = 'open'
    and city_id = (select city_id from public.profiles where id = auth.uid())
    or exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and cs.owner_id = auth.uid()
    )
  );

create policy "shops with active subscription can insert announcements"
  on public.announcements for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.coffee_shops cs
      join public.subscriptions s on s.shop_id = cs.id
      where cs.id = announcements.shop_id
        and cs.owner_id = auth.uid()
        and s.status = 'active'
    )
  );

create policy "shop owners update own announcements"
  on public.announcements for update
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and cs.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and cs.owner_id = auth.uid()
    )
  );

create policy "shop owners read own subscription"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = subscriptions.shop_id and cs.owner_id = auth.uid()
    )
  );

create policy "extras create interests"
  on public.interests for insert
  to authenticated
  with check (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = interests.extra_id and ep.user_id = auth.uid()
    )
  );

create policy "interests readable by participants"
  on public.interests for select
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = interests.extra_id and ep.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.announcements a
      join public.coffee_shops cs on cs.id = a.shop_id
      where a.id = interests.announcement_id and cs.owner_id = auth.uid()
    )
  );

create policy "shop owners update interests on their gigs"
  on public.interests for update
  to authenticated
  using (
    exists (
      select 1
      from public.announcements a
      join public.coffee_shops cs on cs.id = a.shop_id
      where a.id = interests.announcement_id and cs.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.announcements a
      join public.coffee_shops cs on cs.id = a.shop_id
      where a.id = interests.announcement_id and cs.owner_id = auth.uid()
    )
  );

create policy "conversation participants can read"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = conversations.extra_id and ep.user_id = auth.uid()
    )
    or exists (
      select 1 from public.coffee_shops cs
      where cs.id = conversations.shop_id and cs.owner_id = auth.uid()
    )
  );

create policy "conversation participants can insert"
  on public.conversations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = conversations.extra_id and ep.user_id = auth.uid()
    )
    or exists (
      select 1 from public.coffee_shops cs
      where cs.id = conversations.shop_id and cs.owner_id = auth.uid()
    )
  );

create policy "conversation participants read messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      join public.extras_profiles ep on ep.id = c.extra_id
      where c.id = messages.conversation_id and ep.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.conversations c
      join public.coffee_shops cs on cs.id = c.shop_id
      where c.id = messages.conversation_id and cs.owner_id = auth.uid()
    )
  );

create policy "conversation participants send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1
        from public.conversations c
        join public.extras_profiles ep on ep.id = c.extra_id
        where c.id = messages.conversation_id and ep.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.conversations c
        join public.coffee_shops cs on cs.id = c.shop_id
        where c.id = messages.conversation_id and cs.owner_id = auth.uid()
      )
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio images are public"
  on storage.objects for select
  using (bucket_id = 'portfolio');

create policy "extras upload portfolio images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "extras update own portfolio images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "extras delete own portfolio images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

insert into public.cities (slug, name, country_code, timezone) values
  ('paris', 'Paris', 'FR', 'Europe/Paris'),
  ('london', 'London', 'GB', 'Europe/London'),
  ('berlin', 'Berlin', 'DE', 'Europe/Berlin'),
  ('amsterdam', 'Amsterdam', 'NL', 'Europe/Amsterdam');
