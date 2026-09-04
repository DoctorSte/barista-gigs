-- Team accounts: an owner can invite members (capped by plan) who share the
-- café workspace across all locations. Members get everything except billing,
-- location management, and team management (those check owner_id directly).

create table public.cafe_members (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id),
  check (owner_id <> member_id)
);

create table public.cafe_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.cafe_members enable row level security;
alter table public.cafe_invites enable row level security;

-- "Is the caller the owner, or on the owner's team?" Used across policies.
create or replace function public.same_cafe_team(team_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select team_owner = auth.uid()
    or exists (
      select 1 from public.cafe_members m
      where m.owner_id = team_owner and m.member_id = auth.uid()
    );
$$;
revoke all on function public.same_cafe_team(uuid) from public, anon;
grant execute on function public.same_cafe_team(uuid) to authenticated;

create policy "team rows readable by team"
  on public.cafe_members for select
  to authenticated
  using (owner_id = auth.uid() or member_id = auth.uid());

create policy "owners add members"
  on public.cafe_members for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owners remove members, members leave"
  on public.cafe_members for delete
  to authenticated
  using (owner_id = auth.uid() or member_id = auth.uid());

create policy "owners manage invites"
  on public.cafe_invites for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---- Rewrite owner-only policies to team policies ---------------------------

drop policy "published shops readable in city" on public.coffee_shops;
create policy "published shops readable in city"
  on public.coffee_shops for select
  to authenticated
  using (
    (is_published = true and city_id = public.current_profile_city_id())
    or public.same_cafe_team(owner_id)
  );

drop policy "shop owners update own shop" on public.coffee_shops;
create policy "shop owners update own shop"
  on public.coffee_shops for update
  to authenticated
  using (public.same_cafe_team(owner_id))
  with check (public.same_cafe_team(owner_id));

drop policy "open announcements readable in city" on public.announcements;
create policy "open announcements readable in city"
  on public.announcements for select
  to authenticated
  using (
    (status = 'open' and city_id = public.current_profile_city_id())
    or exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "shops with active subscription can insert announcements" on public.announcements;
create policy "shops with active subscription can insert announcements"
  on public.announcements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and public.same_cafe_team(cs.owner_id)
    )
    and exists (
      select 1
      from public.coffee_shops cs2
      join public.subscriptions s on s.shop_id = cs2.id
      where public.same_cafe_team(cs2.owner_id)
        and s.status = 'active'
    )
  );

drop policy "shop owners update own announcements" on public.announcements;
create policy "shop owners update own announcements"
  on public.announcements for update
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and public.same_cafe_team(cs.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "interests readable by participants" on public.interests;
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
      where a.id = interests.announcement_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "shop owners update interests on their gigs" on public.interests;
create policy "shop owners update interests on their gigs"
  on public.interests for update
  to authenticated
  using (
    exists (
      select 1
      from public.announcements a
      join public.coffee_shops cs on cs.id = a.shop_id
      where a.id = interests.announcement_id and public.same_cafe_team(cs.owner_id)
    )
  )
  with check (
    exists (
      select 1
      from public.announcements a
      join public.coffee_shops cs on cs.id = a.shop_id
      where a.id = interests.announcement_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "conversation participants can read" on public.conversations;
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
      where cs.id = conversations.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "conversation participants can insert" on public.conversations;
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
      where cs.id = conversations.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "conversation participants read messages" on public.messages;
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
      where c.id = messages.conversation_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "conversation participants send messages" on public.messages;
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
        where c.id = messages.conversation_id and public.same_cafe_team(cs.owner_id)
      )
    )
  );

drop policy "shop owners read own subscription" on public.subscriptions;
create policy "shop owners read own subscription"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = subscriptions.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "shops recommend baristas who worked for them" on public.recommendations;
create policy "shops recommend baristas who worked for them"
  on public.recommendations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = recommendations.shop_id and public.same_cafe_team(cs.owner_id)
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

drop policy "shops remove own recommendations" on public.recommendations;
create policy "shops remove own recommendations"
  on public.recommendations for delete
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = recommendations.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "payment details readable by owner and hiring shops" on public.extras_payment_details;
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
        and public.same_cafe_team(cs.owner_id)
    )
  );

drop policy "shop owners manage saved baristas" on public.saved_baristas;
create policy "shop owners manage saved baristas"
  on public.saved_baristas for all
  to authenticated
  using (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = saved_baristas.shop_id and public.same_cafe_team(cs.owner_id)
    )
  )
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = saved_baristas.shop_id and public.same_cafe_team(cs.owner_id)
    )
  );

-- Message notifications: notify the barista unless the barista sent it —
-- so messages from team members reach the barista, not the owner.
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  shop_owner uuid;
  extra_user uuid;
  recipient uuid;
  sender_name text;
begin
  select cs.owner_id, ep.user_id
    into shop_owner, extra_user
  from conversations c
  join coffee_shops cs on cs.id = c.shop_id
  join extras_profiles ep on ep.id = c.extra_id
  where c.id = new.conversation_id;

  if shop_owner is null then
    return new;
  end if;

  recipient := case when new.sender_id = extra_user then shop_owner else extra_user end;
  if recipient is null or recipient = new.sender_id then
    return new;
  end if;

  if exists (
    select 1 from notifications n
    where n.user_id = recipient
      and n.type = 'new_message'
      and n.href = '/messages/' || new.conversation_id
      and n.read_at is null
  ) then
    return new;
  end if;

  select display_name into sender_name from profiles where id = new.sender_id;

  insert into notifications (user_id, type, title, body, href)
  values (
    recipient,
    'new_message',
    coalesce(sender_name, 'Someone') || ' sent you a message',
    left(new.body, 140),
    '/messages/' || new.conversation_id
  );

  return new;
end;
$$;
