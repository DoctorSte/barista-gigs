import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarClock, Globe, Info, MapPin, Phone, TriangleAlert } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPay, formatShift, formatShiftRange } from "@/lib/format";
import { machineTypeLabel, skillLabel, WEEKDAYS } from "@/lib/constants";
import { Badge, InterestStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InterestForm } from "@/components/interest-form";
import type { Announcement, CoffeeShop, Interest } from "@/lib/database.types";

export const metadata: Metadata = { title: "Gig details" };

type GigRow = Announcement & { coffee_shops: CoffeeShop | null };

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
    .select("*, coffee_shops(*)")
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
    .select("id, announcements!inner(id, title, shifts, starts_at, ends_at)")
    .eq("extra_id", extra.id)
    .eq("status", "accepted");
  const acceptedGigs = ((acceptedData ?? []) as unknown as {
    id: string;
    announcements: Pick<Announcement, "id" | "title" | "shifts" | "starts_at" | "ends_at">;
  }[])
    .map((row) => row.announcements)
    .filter((other) => other.id !== gig.id);

  const thisGigIntervals = gigIntervals(gig);
  const conflictTitles = [
    ...new Set(
      acceptedGigs
        .filter((other) => intervalsOverlap(thisGigIntervals, gigIntervals(other)))
        .map((other) => other.title),
    ),
  ];

  const weekly = extra.availability?.weekly ?? [];
  const offDayNames =
    weekly.length > 0
      ? [
          ...new Set(
            gig.shifts
              .map((shift) => mondayWeekday(shift.date))
              .filter((day) => !weekly.includes(day)),
          ),
        ]
          .sort((a, b) => a - b)
          .map((day) => WEEKDAYS[day])
      : [];

  const shop = gig.coffee_shops;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/gigs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All gigs
      </Link>

      <div className="rise-in">
        <p className="text-sm text-muted-foreground">{shop?.name ?? "Coffee shop"}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{gig.title}</h1>
          <span className="rounded-md bg-accent-soft px-3 py-1.5 text-lg font-semibold text-accent">
            {formatPay(gig.pay_rate_cents, gig.pay_type)}
          </span>
        </div>
        {gig.shifts.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1">
            {gig.shifts.map((shift, index) => (
              <li
                key={index}
                className="flex items-center gap-1.5 text-[15px] text-muted-foreground"
              >
                <CalendarClock className="size-4" />
                {formatShift(shift)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <CalendarClock className="size-4" />
            {formatShiftRange(gig.starts_at, gig.ends_at)}
          </p>
        )}
        {offDayNames.length > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-3 py-1.5 text-[13px] text-warning">
            <Info className="size-3.5 shrink-0" />
            Heads up — {offDayNames.join(", ")} {offDayNames.length > 1 ? "are" : "is"} outside
            your usual availability.
          </p>
        ) : null}
        {gig.required_skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {gig.required_skills.map((skill) => (
              <Badge key={skill}>{skillLabel(skill)}</Badge>
            ))}
          </div>
        ) : null}
        <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed">{gig.description}</p>
      </div>

      {shop ? (
        <Card className="rise-in mt-8 [animation-delay:80ms]">
          <h2 className="font-display text-lg font-semibold">{shop.name}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" /> {shop.address}
          </p>
          {shop.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{shop.description}</p>
          ) : null}
          {shop.machines.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shop.machines.map((machine, index) => (
                <Badge key={index}>
                  {machine.name}
                  <span className="ml-1 opacity-60">{machineTypeLabel(machine.type)}</span>
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {shop.website ? (
              <a
                href={shop.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground"
              >
                <Globe className="size-4" /> Website
              </a>
            ) : null}
            {shop.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-4" /> {shop.phone}
              </span>
            ) : null}
            {shop.lat != null && shop.lng != null ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground"
              >
                <MapPin className="size-4" /> Open in Google Maps
              </a>
            ) : null}
          </div>
          {shop.lat != null && shop.lng != null ? (
            <div className="mt-4 overflow-hidden rounded-md border border-border">
              <iframe
                title={`Map showing ${shop.name}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${shop.lng - 0.006}%2C${shop.lat - 0.004}%2C${shop.lng + 0.006}%2C${shop.lat + 0.004}&layer=mapnik&marker=${shop.lat}%2C${shop.lng}`}
                className="h-56 w-full"
                loading="lazy"
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="rise-in mt-8 [animation-delay:140ms]">
        {conflictTitles.length > 0 ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              This overlaps with your accepted shift at{" "}
              {conflictTitles.map((title) => `“${title}”`).join(", ")}.
            </p>
          </div>
        ) : null}
        {interest ? (
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">You applied to this gig</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {interest.status === "accepted"
                  ? "You're in — the shop accepted your application."
                  : interest.status === "declined"
                    ? "The shop went with someone else this time."
                    : "The shop hasn't responded yet."}
              </p>
            </div>
            <InterestStatusBadge status={interest.status} />
          </Card>
        ) : gig.status === "open" ? (
          <InterestForm announcementId={gig.id} />
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">This gig is no longer open.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
