-- Referral rewards: the referrer earns one free month the first time a café
-- they referred activates a subscription. The flag lives on the *referred*
-- shop's row so the reward can only ever be granted once.
alter table public.coffee_shops
  add column referral_reward_granted boolean not null default false;

-- SOS gigs: urgent shift covers that ping every available barista in the city.
alter table public.announcements
  add column is_sos boolean not null default false;
