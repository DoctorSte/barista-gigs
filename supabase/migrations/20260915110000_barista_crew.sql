-- Baristas can bring other baristas in. The referrer is recorded on the new
-- profile at onboarding (from the same /r/<code> cookie cafés use) and drives
-- the crew count and milestone badges on the profile and public passport.
-- There is no payout attached — the reward is status.

alter table public.extras_profiles
  add column referred_by_extra uuid references public.extras_profiles (id);

create index extras_profiles_referred_by_extra_idx
  on public.extras_profiles (referred_by_extra)
  where referred_by_extra is not null;
