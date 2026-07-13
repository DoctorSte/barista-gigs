import type { Availability } from "./types";

function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlapsWeekly(
  availability: Availability,
  startsAt: Date,
  endsAt: Date,
): boolean {
  const startDay = startsAt.getDay();
  const endDay = endsAt.getDay();
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinutes = endsAt.getHours() * 60 + endsAt.getMinutes();

  return availability.weekly.some((slot) => {
    if (slot.day !== startDay && slot.day !== endDay) {
      return false;
    }

    const slotStart = parseTime(slot.start);
    const slotEnd = parseTime(slot.end);
    return startMinutes >= slotStart && endMinutes <= slotEnd;
  });
}

function isBlackedOut(availability: Availability, startsAt: Date): boolean {
  const day = startsAt.toISOString().slice(0, 10);
  return availability.blackoutDates.includes(day);
}

export function availabilityOverlapsGig(
  availability: Availability,
  startsAtIso: string,
  endsAtIso: string,
): boolean {
  const startsAt = new Date(startsAtIso);
  const endsAt = new Date(endsAtIso);

  if (isBlackedOut(availability, startsAt)) {
    return false;
  }

  return overlapsWeekly(availability, startsAt, endsAt);
}

export function profileCompletenessScore(input: {
  bio: string | null;
  yearsExperience: number | null;
  hourlyRateCents: number | null;
  skills: string[];
  photoCount: number;
}): number {
  let score = 0;
  if (input.bio && input.bio.length > 20) score += 2;
  if (input.yearsExperience != null) score += 1;
  if (input.hourlyRateCents != null) score += 2;
  if (input.skills.length > 0) score += 1;
  score += Math.min(input.photoCount, 3);
  return score;
}
