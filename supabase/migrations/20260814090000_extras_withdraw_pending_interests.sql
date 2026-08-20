-- Let baristas withdraw their own pending applications (used when changing city).
create policy "extras delete own pending interests"
  on public.interests for delete
  to authenticated
  using (
    status = 'pending'
    and exists (
      select 1 from public.extras_profiles ep
      where ep.id = interests.extra_id and ep.user_id = auth.uid()
    )
  );
