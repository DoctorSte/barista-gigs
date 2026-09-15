-- Baristas can email their referral link straight to a café. Each send is
-- recorded so the barista can see who they invited, the same address isn't
-- mailed twice, and a daily cap keeps the invite form from becoming a way to
-- send mail from our domain to arbitrary people.

create table public.referral_invites (
  id uuid primary key default gen_random_uuid(),
  extra_id uuid not null references public.extras_profiles (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (extra_id, email)
);

create index referral_invites_extra_created_idx
  on public.referral_invites (extra_id, created_at desc);

alter table public.referral_invites enable row level security;

-- Baristas read and record their own invites. The daily cap is enforced in the
-- server action before it sends; a forged insert can only use up the sender's
-- own quota, and there is no delete policy to free it again.
create policy "baristas read own referral invites"
  on public.referral_invites for select
  to authenticated
  using (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = referral_invites.extra_id and ep.user_id = auth.uid()
    )
  );

create policy "baristas record own referral invites"
  on public.referral_invites for insert
  to authenticated
  with check (
    exists (
      select 1 from public.extras_profiles ep
      where ep.id = referral_invites.extra_id and ep.user_id = auth.uid()
    )
  );
