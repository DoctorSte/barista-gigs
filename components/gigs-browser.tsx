"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, CalendarClock, List, Map as MapIcon } from "lucide-react";
import type { Announcement } from "@/lib/database.types";
import { formatGigSchedule, formatPay } from "@/lib/format";
import { SKILLS, skillLabel } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ChipGroup } from "@/components/ui/chip-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { GigsMap } from "@/components/gigs-map";
import { cn } from "@/lib/utils";

export type BrowserGig = Announcement & {
  coffee_shops: { name: string; address: string; lat: number | null; lng: number | null } | null;
};

export function GigsBrowser({ gigs }: { gigs: BrowserGig[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [skills, setSkills] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");

  const filtered = useMemo(() => {
    const min = Number(minRate) * 100;
    return gigs.filter((gig) => {
      if (skills.length > 0 && !skills.every((s) => gig.required_skills.includes(s))) return false;
      // The €/hr filter only applies to hourly gigs; flat/monthly-rate gigs stay visible.
      if (min > 0 && gig.pay_type === "hourly" && gig.pay_rate_cents < min) return false;
      return true;
    });
  }, [gigs, skills, minRate]);

  const mapGigs = useMemo(
    () =>
      filtered
        .filter((gig) => gig.coffee_shops?.lat != null && gig.coffee_shops?.lng != null)
        .map((gig) => ({
          id: gig.id,
          title: gig.title,
          pay: formatPay(gig.pay_rate_cents, gig.pay_type),
          shopName: gig.coffee_shops?.name ?? "Coffee shop",
          lat: gig.coffee_shops!.lat!,
          lng: gig.coffee_shops!.lng!,
        })),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2.5">
          <ChipGroup
            options={[...SKILLS]}
            selected={skills}
            onToggle={(value) =>
              setSkills((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
              )
            }
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Pays at least</span>
            <Input
              type="number"
              min={0}
              step={1}
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              className="h-8 w-20"
              aria-label="Minimum hourly rate in euros"
            />
            <span>€/hr</span>
          </div>
        </div>

        <div className="grid h-9 grid-cols-2 gap-1 rounded-md bg-muted p-1" role="radiogroup">
          {(
            [
              { value: "list", label: "List", icon: List },
              { value: "map", label: "Map", icon: MapIcon },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={view === option.value}
              onClick={() => setView(option.value)}
              className={cn(
                "pressable inline-flex items-center gap-1.5 rounded-sm px-3 text-[13px] font-medium outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-ring",
                view === option.value
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <option.icon className="size-4" /> {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          mascot
          title="No gigs match"
          description="Try removing a filter — or check back soon."
        />
      ) : view === "map" ? (
        <div className="flex flex-col gap-2">
          <GigsMap gigs={mapGigs} />
          {mapGigs.length < filtered.length ? (
            <p className="text-[13px] text-muted-foreground">
              {filtered.length - mapGigs.length} gig
              {filtered.length - mapGigs.length === 1 ? "" : "s"} without a map location{" "}
              {filtered.length - mapGigs.length === 1 ? "is" : "are"} only in the list view.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {filtered.map((gig) => (
            <li key={gig.id}>
              <Link
                href={`/gigs/${gig.id}`}
                className="pressable block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      {gig.coffee_shops?.name ?? "Coffee shop"}
                    </p>
                    <h2 className="mt-0.5 flex flex-wrap items-center gap-2 font-display text-xl font-semibold tracking-tight">
                      {gig.is_sos ? <Badge tone="danger">SOS</Badge> : null}
                      {gig.title}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-md bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
                    {formatPay(gig.pay_rate_cents, gig.pay_type)}
                  </span>
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {gig.kind !== "shift" ? (
                    <Briefcase className="size-4" />
                  ) : (
                    <CalendarClock className="size-4" />
                  )}
                  {formatGigSchedule(gig)}
                </p>
                {gig.required_skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {gig.required_skills.map((skill) => (
                      <Badge key={skill}>{skillLabel(skill)}</Badge>
                    ))}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
