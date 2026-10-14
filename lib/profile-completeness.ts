import type { ExtraProfile, Profile } from "@/lib/database.types";

/**
 * What a barista profile still needs before cafés will realistically book
 * from it. Each entry is a human line for the reminder email; an empty list
 * means the profile is complete.
 */
export function missingProfileItems(
  extra: Pick<ExtraProfile, "bio" | "skills" | "hourly_rate_cents" | "rates">,
  profile: Pick<Profile, "avatar_url"> | null,
): string[] {
  const missing: string[] = [];
  if (!profile?.avatar_url) missing.push("A photo — cafés want to see who's turning up");
  if (extra.skills.length === 0) missing.push("Your skills — espresso, latte art, pour-over…");
  if (!extra.bio?.trim()) missing.push("A short bio — where you've worked, what you're into");
  if (extra.hourly_rate_cents === null && extra.rates.length === 0) {
    missing.push("Your hourly rate — so cafés know what to expect");
  }
  return missing;
}
