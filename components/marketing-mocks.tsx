import { CalendarDays, Check, Search, Siren, Star, X } from "lucide-react";
import type { ShowcaseCopy } from "@/lib/marketing-copy";

/**
 * Static replicas of real product surfaces for the marketing pages. They use
 * the same tokens and shapes as the live UI so the page shows the product
 * rather than describing it — decorative, so hidden from assistive tech
 * (the prose beside each one carries the meaning).
 */

type Mock = ShowcaseCopy["mock"];

const FRAME =
  "rounded-xl border border-border bg-surface p-3 shadow-[0_18px_40px_-28px_rgb(0_0_0/0.45)]";

function Stars({ filled = 5 }: { filled?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={
            value <= filled ? "size-3 fill-foreground text-foreground" : "size-3 text-border-strong"
          }
        />
      ))}
    </span>
  );
}

/** The café planner: a week grid with open shifts, assignees and internal staff. */
export function PlannerMock({ t }: { t: Mock }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = [14, 15, 16, 17, 18, 19, 20];
  const rows = [
    {
      name: t.openShifts,
      tone: "open" as const,
      cells: [null, "08–15", null, null, "18–23", null, null],
      hours: "",
    },
    {
      name: "Amara D.",
      tone: "booked" as const,
      cells: ["07–15", null, null, "07–15", null, "09–17", null],
      hours: `24${t.hours}`,
    },
    {
      name: "Nina K.",
      tone: "booked" as const,
      cells: [null, null, "09–17", null, null, null, "10–18"],
      hours: `16${t.hours}`,
    },
    {
      name: "Jules",
      tone: "staff" as const,
      cells: [null, "07–19", null, "07–19", null, null, null],
      hours: `24${t.hours}`,
    },
  ];

  const chipTone = {
    open: "border border-warning/40 bg-warning-soft text-warning",
    booked: "border border-success/40 bg-success-soft text-success",
    staff: "border border-primary bg-primary text-primary-foreground",
  };

  return (
    <div aria-hidden className={FRAME}>
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium text-muted-foreground">
        <CalendarDays className="size-3.5" />
        {t.weekOf}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[76px_repeat(7,1fr)] border-b border-border bg-muted/40">
          <div />
          {days.map((day, index) => (
            <div key={index} className="border-l border-border/60 px-1 py-1.5 text-center">
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{day}</p>
              <p className="font-display text-[11px] font-semibold leading-none">{dates[index]}</p>
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[76px_repeat(7,1fr)] border-b border-border/60 last:border-b-0"
          >
            <div className="flex items-center justify-between gap-1 px-2 py-1.5">
              <span className="truncate text-[10px] font-medium">{row.name}</span>
              {row.hours ? (
                <span className="text-[9px] text-muted-foreground">{row.hours}</span>
              ) : null}
            </div>
            {row.cells.map((cell, index) => (
              <div key={index} className="min-h-7 border-l border-border/60 p-0.5">
                {cell ? (
                  <span
                    className={`block rounded-sm px-1 py-0.5 text-[8px] font-medium leading-tight ${chipTone[row.tone]}`}
                  >
                    {cell}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** SOS: an urgent gig and the applications it pulls in. */
export function SosMock({ t }: { t: Mock }) {
  return (
    <div aria-hidden className={`${FRAME} flex flex-col gap-2.5`}>
      <div className="rounded-lg border border-danger/30 bg-danger-soft p-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
            <Siren className="size-3" />
            {t.sosLabel}
          </span>
          <span className="text-[11px] text-danger/80">{t.sosTime}</span>
        </div>
        <p className="mt-1.5 font-display text-sm font-semibold">{t.sosTitle}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{t.alerted}</p>
      </div>
      {[
        { initials: "AD", name: "Amara Diallo", when: t.appliedNow },
        { initials: "NK", name: "Nina Kowalska", when: t.appliedMin },
      ].map((row) => (
        <div
          key={row.initials}
          className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-raised p-2.5"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[9px] font-semibold text-accent">
            {row.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium">{row.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">{row.when}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-sm bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground">
            {t.accept}
          </span>
        </div>
      ))}
    </div>
  );
}

/** An applicant card carrying their track record. */
export function TrackRecordMock({ t }: { t: Mock }) {
  return (
    <div aria-hidden className={FRAME}>
      <div className="rounded-lg border border-border bg-surface-raised p-3.5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            AD
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium">Amara Diallo</p>
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
                €30{t.perHour}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Stars />
                <span className="font-medium text-foreground">4.9</span> (12)
              </span>
              <span>{t.confirmedShifts}</span>
              <span className="font-medium text-foreground">{t.showUpRate}</span>
            </div>
            <p className="mt-2.5 rounded-md bg-muted/60 px-2.5 py-2 text-[10px] leading-relaxed">
              {t.reviewQuote}
              <span className="mt-1 block text-muted-foreground">— {t.reviewAuthor}</span>
            </p>
            <div className="mt-2.5 flex gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-2 py-1 text-[9px] font-medium text-primary-foreground">
                <Check className="size-3" />
                {t.accept}
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[9px] font-medium text-muted-foreground">
                <X className="size-3" />
                {t.decline}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The barista directory with its filter row. */
export function DirectoryMock({ t }: { t: Mock }) {
  const baristas = t.directoryRows.map((row) => ({
    ...row,
    initials: row.name
      .split(" ")
      .map((part) => part[0])
      .join(""),
  }));
  return (
    <div aria-hidden className={FRAME}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Search className="size-3 text-muted-foreground" />
        {[t.filterRating, t.filterExperience, t.filterLanguage, t.filterFree].map((label) => (
          <span
            key={label}
            className="rounded-full border border-foreground/35 bg-muted px-2 py-0.5 text-[9px] font-medium"
          >
            {label}
          </span>
        ))}
        <span className="ml-auto text-[9px] text-muted-foreground">{t.results}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {baristas.map((barista) => (
          <div
            key={barista.name}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-raised p-2.5"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[9px] font-semibold text-accent">
              {barista.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">{barista.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{barista.meta}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Stars filled={4} />
              <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                {barista.rate}
                {t.perHour}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
