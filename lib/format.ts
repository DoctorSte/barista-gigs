// Formatting helpers. Functions take an optional BCP-47 `loc` tag (defaults to
// en-GB); pages thread the viewer's locale via dateLocale()/useLocaleTag().

const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function isFr(loc: string) {
  return loc.startsWith("fr");
}

export function formatMoney(cents: number, currency = "EUR") {
  let formatter = CURRENCY_FORMATTERS.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    });
    CURRENCY_FORMATTERS.set(currency, formatter);
  }
  return formatter.format(cents / 100);
}

export function formatPay(
  cents: number,
  payType: "hourly" | "flat" | "monthly",
  currency = "EUR",
  loc = "en-GB",
) {
  const amount = formatMoney(cents, currency);
  if (payType === "monthly") return `${amount}${isFr(loc) ? "/mois" : "/month"}`;
  if (payType === "hourly") return `${amount}${isFr(loc) ? "/h" : "/hr"}`;
  return isFr(loc) ? `${amount} forfait` : `${amount} flat`;
}

export function formatListingKind(kind: "shift" | "full_time" | "part_time", loc = "en-GB") {
  if (kind === "full_time") return isFr(loc) ? "Temps plein" : "Full-time";
  if (kind === "part_time") return isFr(loc) ? "Temps partiel" : "Part-time";
  return "Shift";
}

export function formatDate(iso: string, loc = "en-GB") {
  return new Date(iso).toLocaleDateString(loc, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string, loc = "en-GB") {
  return new Date(iso).toLocaleString(loc, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string, loc = "en-GB") {
  return new Date(iso).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
}

/** "Fri 22 Aug, 08:00 – 14:00" or spans across days */
export function formatShiftRange(startsAt: string, endsAt: string, loc = "en-GB") {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${formatDateTime(startsAt, loc)} – ${formatTime(endsAt, loc)}`;
  return `${formatDateTime(startsAt, loc)} → ${formatDateTime(endsAt, loc)}`;
}

/** "Sat 23 Aug, 08:00 – 15:00" for one entry of a gig's shifts list */
export function formatShift(shift: { date: string; start: string; end: string }, loc = "en-GB") {
  return `${formatDate(`${shift.date}T00:00`, loc)}, ${shift.start} – ${shift.end}`;
}

/** One-line schedule for listing cards: jobs → kind + hours, single shift → full range, multi → count + span */
export function formatGigSchedule(
  gig: {
    starts_at: string;
    ends_at: string;
    shifts?: { date: string; start: string; end: string }[];
    kind?: "shift" | "full_time" | "part_time";
    weekly_hours?: number | null;
  },
  loc = "en-GB",
) {
  if (gig.kind && gig.kind !== "shift") {
    const label = formatListingKind(gig.kind, loc);
    if (gig.weekly_hours) {
      return `${label} · ~${gig.weekly_hours} h/${isFr(loc) ? "semaine" : "week"}`;
    }
    return isFr(loc) ? `Poste ${label.toLowerCase()}` : `${label} position`;
  }
  if (!gig.shifts || gig.shifts.length <= 1) {
    return formatShiftRange(gig.starts_at, gig.ends_at, loc);
  }
  return `${gig.shifts.length} dates · ${formatDate(gig.starts_at, loc)} → ${formatDate(gig.ends_at, loc)}`;
}

export function formatRelative(iso: string, loc = "en-GB") {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  const fr = isFr(loc);
  if (minutes < 1) return fr ? "à l'instant" : "just now";
  if (minutes < 60) return fr ? `il y a ${minutes} min` : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return fr ? `il y a ${hours} h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return fr ? `il y a ${days} j` : `${days}d ago`;
  return formatDate(iso, loc);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
