-- Café opening hours (bounds for the weekly shift scheduler). Null = not set.
-- Shape: [{ "open": "07:00", "close": "19:00" } | null, ... 7 entries, Mon first]
alter table public.coffee_shops
  add column opening_hours jsonb;

-- Barista availability upgrades from day toggles to per-day hour windows:
-- weekly: [3,5] → weekly: [{ "day": 3, "start": "00:00", "end": "23:59" }, ...]
-- (a full-day window preserves the old "available that day" semantics)
update public.extras_profiles
set availability = jsonb_build_object(
  'weekly',
  coalesce(
    (
      select jsonb_agg(jsonb_build_object('day', d.value::int, 'start', '00:00', 'end', '23:59'))
      from jsonb_array_elements(availability -> 'weekly') as d
      where jsonb_typeof(d.value) = 'number'
    ),
    '[]'::jsonb
  ),
  'blackoutDates',
  coalesce(availability -> 'blackoutDates', '[]'::jsonb)
)
where jsonb_typeof(availability -> 'weekly') = 'array'
  and exists (
    select 1 from jsonb_array_elements(availability -> 'weekly') as e
    where jsonb_typeof(e.value) = 'number'
  );
