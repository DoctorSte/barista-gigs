"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, FileText, Images, Star, ThumbsUp, Users } from "lucide-react";
import { toast } from "sonner";
import { toggleSavedBarista } from "@/app/actions/saved";
import { formatMoney } from "@/lib/format";
import { languageLabel, SKILLS, skillLabel } from "@/lib/constants";
import type { Availability } from "@/lib/database.types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterBar,
  FilterInput,
  FilterMultiSelect,
  FilterPill,
  FilterSelect,
  FilterToggle,
} from "@/components/ui/filter-bar";
import { RatingStars } from "@/components/review-form";
import { cn } from "@/lib/utils";
import { useDict } from "@/components/i18n-provider";

export type DirectoryBarista = {
  id: string;
  name: string;
  avatarUrl: string | null;
  hourlyRateCents: number | null;
  currency: string;
  yearsExperience: number | null;
  signatureDrink: string | null;
  skills: string[];
  languages: string[];
  recommendations: number;
  shifts: number;
  rating: number | null;
  reviewCount: number;
  completedShifts: number;
  availability: Availability;
  hasCv: boolean;
  portfolioCount: number;
};

/** Weekly availability covers the weekday of `date` and it isn't blacked out. */
function freeOn(availability: Availability, date: string): boolean {
  const weekday = (new Date(`${date}T00:00:00`).getDay() + 6) % 7;
  if (availability?.blackoutDates?.includes(date)) return false;
  return (availability?.weekly ?? []).some((window) => window.day === weekday);
}

export function BaristasBrowser({
  baristas,
  savedIds,
}: {
  baristas: DirectoryBarista[];
  savedIds: string[];
}) {
  const d = useDict();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [skills, setSkills] = useState<string[]>([]);
  const [maxRate, setMaxRate] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [workedWithYou, setWorkedWithYou] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [minRating, setMinRating] = useState("any");
  const [minYears, setMinYears] = useState("any");
  const [language, setLanguage] = useState("any");
  const [freeDate, setFreeDate] = useState("");
  const [hasCv, setHasCv] = useState(false);
  const [hasPortfolio, setHasPortfolio] = useState(false);
  const [sort, setSort] = useState("default");
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  // Only offer languages that someone in this city actually speaks.
  const languageOptions = useMemo(() => {
    const codes = new Set<string>();
    for (const barista of baristas) for (const code of barista.languages) codes.add(code);
    return [...codes]
      .map((code) => ({ value: code, label: languageLabel(code) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [baristas]);

  const filtered = useMemo(() => {
    const max = Number(maxRate) * 100;
    const ratingFloor = minRating === "any" ? 0 : Number(minRating);
    const yearsFloor = minYears === "any" ? 0 : Number(minYears);
    const rows = baristas.filter((barista) => {
      if (skills.length > 0 && !skills.every((s) => barista.skills.includes(s))) return false;
      // Rate cap only applies to baristas with a listed rate.
      if (max > 0 && barista.hourlyRateCents != null && barista.hourlyRateCents > max) {
        return false;
      }
      if (recommendedOnly && barista.recommendations === 0) return false;
      if (workedWithYou && barista.shifts === 0) return false;
      if (savedOnly && !saved.has(barista.id)) return false;
      if (ratingFloor > 0 && (barista.rating ?? 0) < ratingFloor) return false;
      if (yearsFloor > 0 && (barista.yearsExperience ?? 0) < yearsFloor) return false;
      if (language !== "any" && !barista.languages.includes(language)) return false;
      if (freeDate && !freeOn(barista.availability, freeDate)) return false;
      if (hasCv && !barista.hasCv) return false;
      if (hasPortfolio && barista.portfolioCount === 0) return false;
      return true;
    });

    const sorted = [...rows];
    if (sort === "rating") {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "rate") {
      sorted.sort((a, b) => (a.hourlyRateCents ?? Infinity) - (b.hourlyRateCents ?? Infinity));
    } else if (sort === "experience") {
      sorted.sort((a, b) => (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0));
    } else {
      // Favourites float to the top.
      sorted.sort((a, b) => Number(saved.has(b.id)) - Number(saved.has(a.id)));
    }
    return sorted;
  }, [
    baristas,
    skills,
    maxRate,
    recommendedOnly,
    workedWithYou,
    savedOnly,
    minRating,
    minYears,
    language,
    freeDate,
    hasCv,
    hasPortfolio,
    sort,
    saved,
  ]);

  const activeCount =
    skills.length +
    (maxRate ? 1 : 0) +
    (recommendedOnly ? 1 : 0) +
    (workedWithYou ? 1 : 0) +
    (savedOnly ? 1 : 0) +
    (minRating !== "any" ? 1 : 0) +
    (minYears !== "any" ? 1 : 0) +
    (language !== "any" ? 1 : 0) +
    (freeDate ? 1 : 0) +
    (hasCv ? 1 : 0) +
    (hasPortfolio ? 1 : 0);

  function clearAll() {
    setSkills([]);
    setMaxRate("");
    setRecommendedOnly(false);
    setWorkedWithYou(false);
    setSavedOnly(false);
    setMinRating("any");
    setMinYears("any");
    setLanguage("any");
    setFreeDate("");
    setHasCv(false);
    setHasPortfolio(false);
    setSort("default");
  }

  function toggleSave(extraId: string) {
    startTransition(async () => {
      const result = await toggleSavedBarista(extraId);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <FilterBar
          label={d.filters.filters}
          clearLabel={d.filters.clear}
          resultLabel={d.filters.results(filtered.length)}
          activeCount={activeCount}
          onClear={clearAll}
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
          <FilterToggle
            label={d.barista.recommended}
            active={recommendedOnly}
            onToggle={() => setRecommendedOnly((v) => !v)}
            icon={ThumbsUp}
          />
          <FilterToggle
            label={d.barista.workedWithYou}
            active={workedWithYou}
            onToggle={() => setWorkedWithYou((v) => !v)}
            icon={CalendarCheck}
          />
          <FilterToggle
            label={d.barista.saved}
            active={savedOnly}
            onToggle={() => setSavedOnly((v) => !v)}
            icon={Star}
          />
          <FilterPill label={d.barista.rateUpTo} active={Boolean(maxRate)}>
            <FilterInput
              type="number"
              min={0}
              step={1}
              value={maxRate}
              onChange={setMaxRate}
              ariaLabel={d.barista.rateUpTo}
              width="w-10"
              placeholder="–"
            />
            <span className="text-muted-foreground">€{d.common.perHour}</span>
          </FilterPill>
          <FilterPill label={d.filters.minRating} active={minRating !== "any"}>
            <FilterSelect
              ariaLabel={d.filters.minRating}
              value={minRating}
              onChange={setMinRating}
              options={[
                { value: "any", label: d.filters.any },
                ...[3, 4, 4.5].map((n) => ({
                  value: String(n),
                  label: d.filters.ratingPlus(n),
                })),
              ]}
            />
          </FilterPill>
          <FilterPill label={d.filters.experience} active={minYears !== "any"}>
            <FilterSelect
              ariaLabel={d.filters.experience}
              value={minYears}
              onChange={setMinYears}
              options={[
                { value: "any", label: d.filters.any },
                ...[1, 3, 5, 10].map((n) => ({
                  value: String(n),
                  label: d.filters.yearsPlus(n),
                })),
              ]}
            />
          </FilterPill>
          {languageOptions.length > 0 ? (
            <FilterPill label={d.filters.language} active={language !== "any"}>
              <FilterSelect
                ariaLabel={d.filters.language}
                value={language}
                onChange={setLanguage}
                options={[{ value: "any", label: d.filters.any }, ...languageOptions]}
              />
            </FilterPill>
          ) : null}
          <FilterPill label={d.filters.availableOn} active={Boolean(freeDate)}>
            <FilterInput
              type="date"
              value={freeDate}
              onChange={setFreeDate}
              ariaLabel={d.filters.availableOn}
              width="w-[7.5rem]"
            />
          </FilterPill>
          <FilterToggle
            label={d.filters.hasCv}
            active={hasCv}
            onToggle={() => setHasCv((v) => !v)}
            icon={FileText}
          />
          <FilterToggle
            label={d.filters.hasPortfolio}
            active={hasPortfolio}
            onToggle={() => setHasPortfolio((v) => !v)}
            icon={Images}
          />
          <FilterPill label={d.filters.sort} active={sort !== "default"}>
            <FilterSelect
              ariaLabel={d.filters.sort}
              value={sort}
              onChange={setSort}
              options={[
                { value: "default", label: d.filters.sortDefault },
                { value: "rating", label: d.filters.sortRating },
                { value: "rate", label: d.filters.sortRateLow },
                { value: "experience", label: d.filters.sortExperience },
              ]}
            />
          </FilterPill>
        </FilterBar>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={d.barista.noneMatch}
          description={d.barista.noneMatchSub}
        />
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {filtered.map((barista) => (
            <li key={barista.id}>
              <Link
                href={`/cafe/baristas/${barista.id}`}
                className="pressable block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar name={barista.name} src={barista.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 font-medium">
                        {barista.name}
                        <button
                          type="button"
                          aria-pressed={saved.has(barista.id)}
                          aria-label={saved.has(barista.id) ? "Unsave barista" : "Save barista"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSave(barista.id);
                          }}
                          className="pressable rounded-sm p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Star
                            className={cn(
                              "size-4",
                              saved.has(barista.id)
                                ? "fill-accent text-accent"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          />
                        </button>
                      </p>
                      {barista.hourlyRateCents != null ? (
                        <span className="shrink-0 rounded-md bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
                          {formatMoney(barista.hourlyRateCents, barista.currency)}{d.common.perHour}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {[
                        barista.yearsExperience != null
                          ? d.barista.yrsExperience(barista.yearsExperience)
                          : null,
                        barista.languages.length > 0
                          ? barista.languages.map(languageLabel).join(", ")
                          : null,
                        barista.signatureDrink ? d.barista.signature(barista.signatureDrink) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || d.barista.inYourCity}
                    </p>
                    {barista.skills.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {barista.skills.map((skill) => (
                          <Badge key={skill}>{skillLabel(skill)}</Badge>
                        ))}
                      </div>
                    ) : null}
                    {barista.recommendations > 0 ||
                    barista.shifts > 0 ||
                    barista.rating != null ||
                    barista.completedShifts > 0 ? (
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[13px]">
                        {barista.rating != null ? (
                          <RatingStars rating={barista.rating} count={barista.reviewCount} />
                        ) : null}
                        {barista.completedShifts > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <CalendarCheck className="size-3.5" />
                            {d.barista.confirmedShifts(barista.completedShifts)}
                          </span>
                        ) : null}
                        {barista.recommendations > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-success">
                            <ThumbsUp className="size-3.5" />
                            {d.barista.recommendations(barista.recommendations)}
                          </span>
                        ) : null}
                        {barista.shifts > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <CalendarCheck className="size-3.5" />
                            {d.barista.shiftsAtYourShop(barista.shifts)}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
