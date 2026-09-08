import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Briefcase, CalendarClock, Info, TriangleAlert } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatListingKind, formatPay, formatShift, formatShiftRange } from "@/lib/format";
import { skillLabel, WEEKDAYS } from "@/lib/constants";
import { Badge, InterestStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CafeCard } from "@/components/cafe-card";
import { cafeTrustStats } from "@/lib/trust";
import { dateLocale, getDict, getLocale } from "@/lib/i18n";
import { InterestForm } from "@/components/interest-form";
import type { Announcement, CoffeeShop, Interest } from "@/lib/database.types";

export const metadata: Metadata = { title: "Gig details" };

type GigRow = Announcement & {
  coffee_shops: (CoffeeShop & { profiles: { avatar_url: string | null } | null }) | null;
};

type Shift = { date: string; start: string; end: string };

/** Weekday of a shift date using the app's 0=Monday convention. */
function mondayWeekday(date: string) {
  const jsDay = new Date(`${date}T00:00`).getDay();
  return (jsDay + 6) % 7;
}

/** Concrete [start, end) interval for a shift; end <= start means it runs overnight. */
function shiftInterval(shift: Shift): [number, number] {
  const start = new Date(`${shift.date}T${shift.start}`).getTime();
  let end = new Date(`${shift.date}T${shift.end}`).getTime();
  if (end <= start) end += 24 * 60 * 60 * 1000;
  return [start, end];
}

/** Intervals for a gig: its shift list, or the starts_at/ends_at span if it has none. */
function gigIntervals(gig: { shifts: Shift[]; starts_at: string; ends_at: string }) {
  if (gig.shifts.length > 0) return gig.shifts.map(shiftInterval);
  return [[new Date(gig.starts_at).getTime(), new Date(gig.ends_at).getTime()] as [number, number]];
}

function intervalsOverlap(a: [number, number][], b: [number, number][]) {
  return a.some(([aStart, aEnd]) => b.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd));
}

export default async function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { extra } = await requireExtra();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*, coffee_shops(*, profiles:owner_id(avatar_url))")
    .eq("id", id)
    .maybeSingle();
  const gig = data as unknown as GigRow | null;
  if (!gig) notFound();

  const { data: interestData } = await supabase
    .from("interests")
    .select("*")
    .eq("announcement_id", gig.id)
    .eq("extra_id", extra.id)
    .maybeSingle();
  const interest = interestData as Interest | null;

  const { data: acceptedData } = await supabase
    .from("interests")
    .select("id, announcements!inner(id, title, kind, shifts, starts_at, ends_at)")
    .eq("extra_id", extra.id)
    .eq("status", "accepted");
  const acceptedGigs = ((acceptedData ?? []) as unknown as {
    id: string;
    announcements: Pick<Announcement, "id" | "title" | "kind" | "shifts" | "starts_at" | "ends_at">;
  }[])
    .map((row) => row.announcements)
    // Jobs have no concrete times, so they can't produce meaningful overlaps.
    .filter((other) => other.id !== gig.id && other.kind === "shift");

  // Jobs have no concrete shift times, so overlap checks don't apply.
  const conflictTitles =
    gig.kind !== "shift"
      ? []
      : [
          ...new Set(
            acceptedGigs
              .filter((other) => intervalsOverlap(gigIntervals(gig), gigIntervals(other)))
              .map((other) => other.title),
          ),
        ];

  // A shift is "outside availability" when its day has no window, or its
  // hours fall outside the window ("HH:MM" strings compare lexicographically).
  const weekly = extra.availability?.weekly ?? [];
  const offDayNames =
    weekly.length > 0 && gig.kind === "shift"
      ? [
          ...new Set(
            gig.shifts
              .filter((shift) => {
                const window = weekly.find((w) => w.day === mondayWeekday(shift.date));
                return !window || shift.start < window.start || shift.end > window.end;
              })
              .map((shift) => mondayWeekday(shift.date)),
          ),
        ]
          .sort((a, b) => a - b)
          .map((day) => WEEKDAYS[day])
      : [];

  const d = await getDict();
  const loc = dateLocale(await getLocale());
  const shop = gig.coffee_shops;
  const cafeRating = shop
    ? await cafeTrustStats(supabase, shop.id)
    : { rating: null, reviewCount: 0 };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={gig.kind === "shift" ? "/gigs" : "/jobs"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {gig.kind === "shift" ? d.gigs.allGigs : d.gigs.allJobs}
      </Link>

      <div className="rise-in">
        <p className="text-sm text-muted-foreground">{shop?.name ?? "Café"}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex flex-wrap items-center gap-2.5 font-display text-3xl font-semibold tracking-tight">
            {gig.is_sos ? <Badge tone="danger">SOS</Badge> : null}
            {gig.title}
          </h1>
          <span className="rounded-md bg-accent-soft px-3 py-1.5 text-lg font-semibold text-accent">
            {formatPay(gig.pay_rate_cents, gig.pay_type, "EUR", loc)}
          </span>
        </div>
        {gig.kind !== "shift" ? (
          <p className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <Briefcase className="size-4" />
            {formatListingKind(gig.kind, loc)}
            {gig.weekly_hours ? ` · ~${gig.weekly_hours} h/${loc.startsWith("fr") ? "semaine" : "week"}` : ""}
          </p>
        ) : gig.shifts.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1">
            {gig.shifts.map((shift, index) => (
              <li
                key={index}
                className="flex items-center gap-1.5 text-[15px] text-muted-foreground"
              >
                <CalendarClock className="size-4" />
                {formatShift(shift, loc)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <CalendarClock className="size-4" />
            {formatShiftRange(gig.starts_at, gig.ends_at, loc)}
          </p>
        )}
        {offDayNames.length > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-3 py-1.5 text-[13px] text-warning">
            <Info className="size-3.5 shrink-0" />
            {d.gigs.offDays(offDayNames.join(", "), offDayNames.length > 1)}
          </p>
        ) : null}
        {gig.required_skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {gig.required_skills.map((skill) => (
              <Badge key={skill}>{d.labels.skills[skill] ?? skillLabel(skill)}</Badge>
            ))}
          </div>
        ) : null}
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed">{gig.description}</p>
      </div>

      {shop ? (
        <CafeCard
          shop={shop}
          avatarUrl={shop.profiles?.avatar_url}
          className="rise-in mt-8 [animation-delay:80ms]"
          rating={cafeRating.rating}
          reviewCount={cafeRating.reviewCount}
        />
      ) : null}

      <div className="rise-in mt-8 [animation-delay:140ms]">
        {conflictTitles.length > 0 ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{d.gigs.conflict(conflictTitles.map((title) => `“${title}”`).join(", "))}</p>
          </div>
        ) : null}
        {interest ? (
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{d.gigs.youApplied}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {interest.status === "accepted"
                  ? d.gigs.accepted
                  : interest.status === "declined"
                    ? d.gigs.declined
                    : d.gigs.pending}
              </p>
            </div>
            <InterestStatusBadge status={interest.status} />
          </Card>
        ) : gig.status === "open" ? (
          <InterestForm announcementId={gig.id} />
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">{d.gigs.noLongerOpen}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
