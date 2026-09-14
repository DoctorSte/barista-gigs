"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, CalendarClock, Crosshair, List, Map as MapIcon, MapPin } from "lucide-react";
import type { Announcement } from "@/lib/database.types";
import { formatGigSchedule, formatPay } from "@/lib/format";
import { SKILLS, skillLabel } from "@/lib/constants";
import { shiftDuration, toMinutes } from "@/lib/planner";
import { distanceKm, formatKm } from "@/lib/geo";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterBar,
  FilterInput,
  FilterMultiSelect,
  FilterPill,
  FilterSelect,
} from "@/components/ui/filter-bar";
import { GigsMap } from "@/components/gigs-map";
import { useGeolocation } from "@/components/use-geolocation";
import { cn } from "@/lib/utils";
import { useDict, useLocaleTag } from "@/components/i18n-provider";

export type BrowserGig = Announcement & {
  coffee_shops: { name: string; address: string; lat: number | null; lng: number | null } | null;
};

type Duration = "any" | "short" | "mid" | "long" | "full";
type GigType = "any" | "regular" | "event" | "urgent" | "full_time" | "part_time";
type Sort = "soonest" | "paid" | "closest";

/** Minutes of each shift in a gig; jobs have none. */
function shiftLengths(gig: BrowserGig): number[] {
  return gig.shifts.map((shift) => shiftDuration(toMinutes(shift.start), toMinutes(shift.end)));
}

function matchesDuration(minutes: number, bucket: Duration): boolean {
  if (bucket === "short") return minutes <= 240;
  if (bucket === "mid") return minutes > 240 && minutes <= 360;
  if (bucket === "long") return minutes > 360 && minutes <= 480;
  if (bucket === "full") return minutes > 480;
  return true;
}

export function GigsBrowser({
  gigs,
  mode = "shift",
}: {
  gigs: BrowserGig[];
  mode?: "shift" | "job";
}) {
  const d = useDict();
  const loc = useLocaleTag();
  const { coords, status, locate } = useGeolocation();
  const [view, setView] = useState<"list" | "map">("list");
  const [skills, setSkills] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");
  const [duration, setDuration] = useState<Duration>("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [type, setType] = useState<GigType>("any");
  const [maxKm, setMaxKm] = useState("any");
  const [sort, setSort] = useState<Sort>("soonest");

  // Distance is only knowable once the viewer shares their position.
  const withDistance = useMemo(
    () =>
      gigs.map((gig) => {
        const lat = gig.coffee_shops?.lat;
        const lng = gig.coffee_shops?.lng;
        const km =
          coords && lat != null && lng != null ? distanceKm(coords, { lat, lng }) : null;
        return { gig, km };
      }),
    [gigs, coords],
  );

  const filtered = useMemo(() => {
    const min = Number(minRate) * 100;
    const limit = maxKm === "any" ? null : Number(maxKm);
    const rows = withDistance.filter(({ gig, km }) => {
      if (skills.length > 0 && !skills.every((s) => gig.required_skills.includes(s))) return false;
      // The €/hr floor only applies to hourly gigs; flat and monthly stay visible.
      if (min > 0 && gig.pay_type === "hourly" && gig.pay_rate_cents < min) return false;

      if (duration !== "any" && !shiftLengths(gig).some((m) => matchesDuration(m, duration))) {
        return false;
      }

      if (dateFrom || dateTo) {
        const from = dateFrom || "0000-01-01";
        const to = dateTo || "9999-12-31";
        const dates = gig.shifts.map((shift) => shift.date);
        if (dates.length > 0) {
          if (!dates.some((date) => date >= from && date <= to)) return false;
        } else {
          // Jobs carry a visibility window instead of dated shifts.
          const start = gig.starts_at.slice(0, 10);
          const end = gig.ends_at.slice(0, 10);
          if (end < from || start > to) return false;
        }
      }

      if (type === "urgent" && !gig.is_sos) return false;
      if (type === "event" && gig.pay_type !== "flat") return false;
      if (type === "regular" && (gig.is_sos || gig.pay_type !== "hourly")) return false;
      if (type === "full_time" && gig.kind !== "full_time") return false;
      if (type === "part_time" && gig.kind !== "part_time") return false;

      if (limit != null && (km == null || km > limit)) return false;
      return true;
    });

    const sorted = [...rows];
    if (sort === "paid") {
      sorted.sort((a, b) => b.gig.pay_rate_cents - a.gig.pay_rate_cents);
    } else if (sort === "closest") {
      sorted.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    } else {
      sorted.sort((a, b) => a.gig.starts_at.localeCompare(b.gig.starts_at));
    }
    return sorted;
  }, [withDistance, skills, minRate, duration, dateFrom, dateTo, type, maxKm, sort]);

  const activeCount =
    skills.length +
    (minRate ? 1 : 0) +
    (duration !== "any" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (type !== "any" ? 1 : 0) +
    (maxKm !== "any" ? 1 : 0);

  function clearAll() {
    setSkills([]);
    setMinRate("");
    setDuration("any");
    setDateFrom("");
    setDateTo("");
    setType("any");
    setMaxKm("any");
    setSort("soonest");
  }

  const mapGigs = useMemo(
    () =>
      filtered
        .filter(({ gig }) => gig.coffee_shops?.lat != null && gig.coffee_shops?.lng != null)
        .map(({ gig }) => ({
          id: gig.id,
          title: gig.title,
          pay: formatPay(gig.pay_rate_cents, gig.pay_type, "EUR", loc),
          shopName: gig.coffee_shops?.name ?? "Café",
          lat: gig.coffee_shops!.lat!,
          lng: gig.coffee_shops!.lng!,
        })),
    [filtered, loc],
  );

  const typeOptions =
    mode === "job"
      ? [
          { value: "any", label: d.filters.any },
          { value: "full_time", label: d.filters.typeFullTime },
          { value: "part_time", label: d.filters.typePartTime },
        ]
      : [
          { value: "any", label: d.filters.any },
          { value: "regular", label: d.filters.typeRegular },
          { value: "event", label: d.filters.typeEvent },
          { value: "urgent", label: d.filters.typeUrgent },
        ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <FilterBar
          label={d.filters.filters}
          clearLabel={d.filters.clear}
          resultLabel={d.filters.results(filtered.length)}
          activeCount={activeCount}
          onClear={clearAll}
          trailing={
            <div className="grid h-8 grid-cols-2 gap-1 rounded-md bg-muted p-1" role="radiogroup">
              {(
                [
                  { value: "list", label: d.gigs.list, icon: List },
                  { value: "map", label: d.gigs.map, icon: MapIcon },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={view === option.value}
                  onClick={() => setView(option.value)}
                  className={cn(
                    "pressable inline-flex items-center gap-1.5 rounded-sm px-2.5 text-[12px] font-medium outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    view === option.value
                      ? "bg-surface-raised text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <option.icon className="size-3.5" /> {option.label}
                </button>
              ))}
            </div>
          }
        >
          <FilterMultiSelect
            label={d.filters.skills}
            anyLabel={d.filters.any}
            selectedLabel={d.filters.selected}
            options={SKILLS.map((sk) => ({
              value: sk.value,
              label: d.labels.skills[sk.value] ?? sk.label,
            }))}
            selected={skills}
            onToggle={(value) =>
              setSkills((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
              )
            }
          />
          <FilterPill label={d.filters.minRate} active={Boolean(minRate)}>
            <FilterInput
              type="number"
              min={0}
              step={1}
              value={minRate}
              onChange={setMinRate}
              ariaLabel={d.filters.minRate}
              width="w-10"
              placeholder="–"
            />
          </FilterPill>

          {mode === "shift" ? (
            <FilterPill label={d.filters.duration} active={duration !== "any"}>
              <FilterSelect
                ariaLabel={d.filters.duration}
                value={duration}
                onChange={(value) => setDuration(value as Duration)}
                options={[
                  { value: "any", label: d.filters.any },
                  { value: "short", label: d.filters.durationShort },
                  { value: "mid", label: d.filters.durationMid },
                  { value: "long", label: d.filters.durationLong },
                  { value: "full", label: d.filters.durationFull },
                ]}
              />
            </FilterPill>
          ) : null}

          <FilterPill label={d.filters.from} active={Boolean(dateFrom || dateTo)}>
            <FilterInput
              type="date"
              value={dateFrom}
              onChange={setDateFrom}
              ariaLabel={d.filters.from}
              width="w-[7.5rem]"
            />
            <span className="text-muted-foreground">{d.filters.to.toLowerCase()}</span>
            <FilterInput
              type="date"
              value={dateTo}
              onChange={setDateTo}
              ariaLabel={d.filters.to}
              width="w-[7.5rem]"
            />
          </FilterPill>

          <FilterPill label={d.filters.type} active={type !== "any"}>
            <FilterSelect
              ariaLabel={d.filters.type}
              value={type}
              onChange={(value) => setType(value as GigType)}
              options={typeOptions}
            />
          </FilterPill>

          {coords ? (
            <FilterPill label={d.filters.distance} active={maxKm !== "any"}>
              <FilterSelect
                ariaLabel={d.filters.distance}
                value={maxKm}
                onChange={setMaxKm}
                options={[
                  { value: "any", label: d.filters.any },
                  ...[1, 3, 5, 10, 25].map((km) => ({
                    value: String(km),
                    label: d.filters.km(km),
                  })),
                ]}
              />
            </FilterPill>
          ) : (
            <button
              type="button"
              onClick={locate}
              disabled={status === "locating"}
              className="pressable inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[13px] font-medium text-muted-foreground outline-none hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <Crosshair className="size-3.5" />
              {status === "locating" ? d.filters.locating : d.filters.useLocation}
            </button>
          )}

          <FilterPill label={d.filters.sort} active={sort !== "soonest"}>
            <FilterSelect
              ariaLabel={d.filters.sort}
              value={sort}
              onChange={(value) => setSort(value as Sort)}
              options={[
                { value: "soonest", label: d.filters.sortSoonest },
                { value: "paid", label: d.filters.sortBestPaid },
                ...(coords ? [{ value: "closest", label: d.filters.sortClosest }] : []),
              ]}
            />
          </FilterPill>
        </FilterBar>

        {status === "denied" ? (
          <p className="text-[13px] text-muted-foreground">{d.filters.locationDenied}</p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState mascot title={d.gigs.noMatch} description={d.gigs.noMatchSub} />
      ) : view === "map" ? (
        <div className="flex flex-col gap-2">
          <GigsMap gigs={mapGigs} />
          {mapGigs.length < filtered.length ? (
            <p className="text-[13px] text-muted-foreground">
              {d.gigs.notOnMap(filtered.length - mapGigs.length)}
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {filtered.map(({ gig, km }) => (
            <li key={gig.id}>
              <Link
                href={`/gigs/${gig.id}`}
                className="pressable block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm text-muted-foreground">
                      {gig.coffee_shops?.name ?? "Café"}
                      {km != null ? (
                        <span className="inline-flex shrink-0 items-center gap-1">
                          <MapPin className="size-3.5" />
                          {d.filters.away(formatKm(km))}
                        </span>
                      ) : null}
                    </p>
                    <h2 className="mt-0.5 flex flex-wrap items-center gap-2 font-display text-xl font-semibold tracking-tight">
                      {gig.is_sos ? <Badge tone="danger">SOS</Badge> : null}
                      {gig.title}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-md bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
                    {formatPay(gig.pay_rate_cents, gig.pay_type, "EUR", loc)}
                  </span>
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {gig.kind !== "shift" ? (
                    <Briefcase className="size-4" />
                  ) : (
                    <CalendarClock className="size-4" />
                  )}
                  {formatGigSchedule(gig, loc)}
                </p>
                {gig.required_skills.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {gig.required_skills.map((skill) => (
                      <Badge key={skill}>{d.labels.skills[skill] ?? skillLabel(skill)}</Badge>
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
