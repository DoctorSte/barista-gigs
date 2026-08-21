const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

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
) {
  if (payType === "monthly") return `${formatMoney(cents, currency)}/month`;
  const amount = formatMoney(cents, currency);
  return payType === "hourly" ? `${amount}/hr` : `${amount} flat`;
}

export function formatListingKind(kind: "shift" | "full_time" | "part_time") {
  return kind === "full_time" ? "Full-time" : kind === "part_time" ? "Part-time" : "Shift";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** "Fri 22 Aug, 08:00 – 14:00" or spans across days */
export function formatShiftRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return `${formatDateTime(startsAt)} – ${formatTime(endsAt)}`;
  return `${formatDateTime(startsAt)} → ${formatDateTime(endsAt)}`;
}

/** "Sat 23 Aug, 08:00 – 15:00" for one entry of a gig's shifts list */
export function formatShift(shift: { date: string; start: string; end: string }) {
  return `${formatDate(`${shift.date}T00:00`)}, ${shift.start} – ${shift.end}`;
}

/** One-line schedule for listing cards: jobs → kind + hours, single shift → full range, multi → count + span */
export function formatGigSchedule(gig: {
  starts_at: string;
  ends_at: string;
  shifts?: { date: string; start: string; end: string }[];
  kind?: "shift" | "full_time" | "part_time";
  weekly_hours?: number | null;
}) {
  if (gig.kind && gig.kind !== "shift") {
    const label = formatListingKind(gig.kind);
    return gig.weekly_hours ? `${label} · ~${gig.weekly_hours} h/week` : `${label} position`;
  }
  if (!gig.shifts || gig.shifts.length <= 1) {
    return formatShiftRange(gig.starts_at, gig.ends_at);
  }
  return `${gig.shifts.length} dates · ${formatDate(gig.starts_at)} → ${formatDate(gig.ends_at)}`;
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
