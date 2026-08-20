-- Expand cities for hybrid picker: coordinates, source, featured flag.
alter table public.cities
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists source text not null default 'curated'
    check (source in ('curated', 'search')),
  add column if not exists is_featured boolean not null default false;

-- Mark existing launch cities as featured curated.
update public.cities
set
  is_featured = true,
  source = 'curated',
  lat = case slug
    when 'paris' then 48.8566
    when 'london' then 51.5074
    when 'berlin' then 52.52
    when 'amsterdam' then 52.3676
  end,
  lng = case slug
    when 'paris' then 2.3522
    when 'london' then -0.1278
    when 'berlin' then 13.405
    when 'amsterdam' then 4.9041
  end
where slug in ('paris', 'london', 'berlin', 'amsterdam');

insert into public.cities (slug, name, country_code, timezone, lat, lng, source, is_featured, is_active)
values
  ('barcelona', 'Barcelona', 'ES', 'Europe/Madrid', 41.3874, 2.1686, 'curated', true, true),
  ('milan', 'Milan', 'IT', 'Europe/Rome', 45.4642, 9.19, 'curated', true, true),
  ('lisbon', 'Lisbon', 'PT', 'Europe/Lisbon', 38.7223, -9.1393, 'curated', true, true),
  ('vienna', 'Vienna', 'AT', 'Europe/Vienna', 48.2082, 16.3738, 'curated', true, true),
  ('copenhagen', 'Copenhagen', 'DK', 'Europe/Copenhagen', 55.6761, 12.5683, 'curated', true, true),
  ('stockholm', 'Stockholm', 'SE', 'Europe/Stockholm', 59.3293, 18.0686, 'curated', true, true),
  ('dublin', 'Dublin', 'IE', 'Europe/Dublin', 53.3498, -6.2603, 'curated', true, true),
  ('rome', 'Rome', 'IT', 'Europe/Rome', 41.9028, 12.4964, 'curated', true, true),
  ('munich', 'Munich', 'DE', 'Europe/Berlin', 48.1351, 11.582, 'curated', true, true),
  ('hamburg', 'Hamburg', 'DE', 'Europe/Berlin', 53.5511, 9.9937, 'curated', true, true),
  ('brussels', 'Brussels', 'BE', 'Europe/Brussels', 50.8503, 4.3517, 'curated', true, true),
  ('zurich', 'Zurich', 'CH', 'Europe/Zurich', 47.3769, 8.5417, 'curated', true, true)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  timezone = excluded.timezone,
  lat = excluded.lat,
  lng = excluded.lng,
  source = excluded.source,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active;
