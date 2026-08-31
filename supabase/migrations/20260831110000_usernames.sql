-- Usernames power the shareable Barista Passport (/@username/passport).
-- Setting one is the barista's explicit opt-in to a public profile page.
alter table public.profiles
  add column username text unique
  check (username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
