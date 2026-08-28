"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarCheck, ThumbsUp, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { languageLabel, SKILLS, skillLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChipGroup } from "@/components/ui/chip-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

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
};

export function BaristasBrowser({ baristas }: { baristas: DirectoryBarista[] }) {
  const [skills, setSkills] = useState<string[]>([]);
  const [maxRate, setMaxRate] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [workedWithYou, setWorkedWithYou] = useState(false);

  const filtered = useMemo(() => {
    const max = Number(maxRate) * 100;
    return baristas.filter((barista) => {
      if (skills.length > 0 && !skills.every((s) => barista.skills.includes(s))) return false;
      // Rate cap only applies to baristas with a listed rate.
      if (max > 0 && barista.hourlyRateCents != null && barista.hourlyRateCents > max) {
        return false;
      }
      if (recommendedOnly && barista.recommendations === 0) return false;
      if (workedWithYou && barista.shifts === 0) return false;
      return true;
    });
  }, [baristas, skills, maxRate, recommendedOnly, workedWithYou]);

  const toggleClass = (active: boolean) =>
    cn(
      "pressable inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      active
        ? "border-accent bg-accent-soft text-accent"
        : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
    );

  return (
    <div className="flex flex-col gap-5">
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={recommendedOnly}
            onClick={() => setRecommendedOnly((v) => !v)}
            className={toggleClass(recommendedOnly)}
          >
            <ThumbsUp className="size-3.5" /> Recommended
          </button>
          <button
            type="button"
            aria-pressed={workedWithYou}
            onClick={() => setWorkedWithYou((v) => !v)}
            className={toggleClass(workedWithYou)}
          >
            <CalendarCheck className="size-3.5" /> Worked with you
          </button>
          <span className="ml-1 flex items-center gap-2 text-sm text-muted-foreground">
            Rate up to
            <Input
              type="number"
              min={0}
              step={1}
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              className="h-8 w-20"
              aria-label="Maximum hourly rate in euros"
            />
            €/hr
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No baristas match"
          description="Try removing a filter — or check back soon."
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
                      <p className="font-medium">{barista.name}</p>
                      {barista.hourlyRateCents != null ? (
                        <span className="shrink-0 rounded-md bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
                          {formatMoney(barista.hourlyRateCents, barista.currency)}/hr
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {[
                        barista.yearsExperience != null
                          ? `${barista.yearsExperience} yrs experience`
                          : null,
                        barista.languages.length > 0
                          ? barista.languages.map(languageLabel).join(", ")
                          : null,
                        barista.signatureDrink ? `Signature: ${barista.signatureDrink}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Barista in your city"}
                    </p>
                    {barista.skills.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {barista.skills.map((skill) => (
                          <Badge key={skill}>{skillLabel(skill)}</Badge>
                        ))}
                      </div>
                    ) : null}
                    {barista.recommendations > 0 || barista.shifts > 0 ? (
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[13px]">
                        {barista.recommendations > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-success">
                            <ThumbsUp className="size-3.5" />
                            {barista.recommendations}{" "}
                            {barista.recommendations === 1 ? "recommendation" : "recommendations"}
                          </span>
                        ) : null}
                        {barista.shifts > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <CalendarCheck className="size-3.5" />
                            {barista.shifts} {barista.shifts === 1 ? "shift" : "shifts"} at your
                            shop
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
