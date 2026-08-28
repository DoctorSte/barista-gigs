-- Barista languages
alter table public.extras_profiles
  add column languages text[] not null default '{}';

-- Multi-location cafés (owner-only, capped by plan in the app layer):
-- an owner may now have several coffee_shops rows.
alter table public.coffee_shops drop constraint coffee_shops_owner_id_key;

-- One subscription covers all of an owner's locations: posting from any
-- location is allowed when ANY of the owner's shops holds an active
-- subscription (the row stays keyed to the primary location).
drop policy "shops with active subscription can insert announcements" on public.announcements;
create policy "shops with active subscription can insert announcements"
  on public.announcements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.coffee_shops cs
      where cs.id = announcements.shop_id and cs.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.coffee_shops cs2
      join public.subscriptions s on s.shop_id = cs2.id
      where cs2.owner_id = auth.uid()
        and s.status = 'active'
    )
  );
