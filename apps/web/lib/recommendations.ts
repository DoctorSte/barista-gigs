import {
  availabilityOverlapsGig,
  profileCompletenessScore,
  type Availability,
} from "@barista-gigs/shared";
import { createClient } from "@/lib/supabase/server";

function relationOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getRecommendedBaristas(input: {
  cityId: string;
  startsAt: string;
  endsAt: string;
  requiredSkills: string[];
}) {
  const supabase = await createClient();
  const { data: extras } = await supabase
    .from("extras_profiles")
    .select(
      "id, bio, years_experience, hourly_rate_cents, currency, skills, availability, is_available, profiles(display_name)",
    )
    .eq("city_id", input.cityId)
    .eq("is_available", true);

  if (!extras?.length) return [];

  const extraIds = extras.map((e) => e.id);
  const { data: photos } = await supabase
    .from("portfolio_photos")
    .select("extra_id")
    .in("extra_id", extraIds);

  const photoCounts = new Map<string, number>();
  for (const photo of photos ?? []) {
    photoCounts.set(photo.extra_id, (photoCounts.get(photo.extra_id) ?? 0) + 1);
  }

  return extras
    .map((extra) => {
      const availability = extra.availability as Availability;
      const skillMatches = input.requiredSkills.filter((skill) =>
        extra.skills.includes(skill),
      ).length;
      const available = availabilityOverlapsGig(
        availability,
        input.startsAt,
        input.endsAt,
      );
      const completeness = profileCompletenessScore({
        bio: extra.bio,
        yearsExperience: extra.years_experience,
        hourlyRateCents: extra.hourly_rate_cents,
        skills: extra.skills,
        photoCount: photoCounts.get(extra.id) ?? 0,
      });

      return {
        ...extra,
        displayName:
          relationOne(extra.profiles)?.display_name ?? "Barista",
        skillMatches,
        available,
        completeness,
        score: (available ? 10 : 0) + skillMatches * 3 + completeness,
      };
    })
    .filter((extra) => extra.available)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
