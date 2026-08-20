-- Break recursive profiles RLS by reading city_id via security definer helper.
create or replace function public.current_profile_city_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select city_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_profile_city_id() from public;
grant execute on function public.current_profile_city_id() to authenticated, anon;

drop policy if exists "profiles are readable in same city" on public.profiles;

create policy "profiles are readable in same city"
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or city_id = public.current_profile_city_id()
  );

-- Cities had RLS enabled with no policies (deny-all). Allow public read of active cities.
drop policy if exists "cities are publicly readable" on public.cities;
create policy "cities are publicly readable"
  on public.cities
  for select
  to anon, authenticated
  using (true);
