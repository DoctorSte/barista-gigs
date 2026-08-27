-- Barista CV uploads. Private bucket: reads happen via short-lived signed
-- URLs generated server-side on café-facing pages; storage policies only let
-- the owner manage files under their own uid/ folder.

alter table public.extras_profiles
  add column cv_path text,
  add column cv_filename text;

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "extras read own cv"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "extras upload own cv"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "extras update own cv"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "extras delete own cv"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cvs' and auth.uid()::text = (storage.foldername(name))[1]);
