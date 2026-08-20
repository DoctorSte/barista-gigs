-- Gigs can cover multiple dates: shifts = [{ "date": "2026-08-23",
-- "start": "08:00", "end": "15:00" }, ...]. starts_at/ends_at stay as the
-- derived overall span for sorting and open-gig filtering.

alter table public.announcements
  add column shifts jsonb not null default '[]'::jsonb;

update public.announcements
set shifts = jsonb_build_array(
  jsonb_build_object(
    'date', to_char(starts_at, 'YYYY-MM-DD'),
    'start', to_char(starts_at, 'HH24:MI'),
    'end', to_char(ends_at, 'HH24:MI')
  )
)
where shifts = '[]'::jsonb;
