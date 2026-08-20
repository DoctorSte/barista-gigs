import Link from "next/link";
import type { Metadata } from "next";
import { CalendarCheck, MapPin, ThumbsUp, Users } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { skillLabel } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { RateCard } from "@/lib/database.types";

export const metadata: Metadata = { title: "Baristas" };

type BaristaRow = {
  id: string;
  user_id: string;
  years_experience: number | null;
  hourly_rate_cents: number | null;
  currency: string;
  rates: RateCard[];
  signature_drink: string | null;
  skills: string[];
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export default async function BaristasPage() {
  const { user, shop } = await requireShop();
  const supabase = await createClient();

  const { data } = await supabase
    .from("extras_profiles")
    .select(
      "id, user_id, years_experience, hourly_rate_cents, currency, rates, signature_drink, skills, profiles:user_id(display_name, avatar_url)",
    )
    .eq("city_id", shop.city_id)
    .eq("is_available", true)
    .neq("user_id", user.id)
    .order("created_at");
  const baristas = (data ?? []) as unknown as BaristaRow[];

  const extraIds = baristas.map((barista) => barista.id);
  const nowIso = new Date().toISOString();
  const [{ data: recData }, { data: shiftData }] = extraIds.length
    ? await Promise.all([
        supabase.from("recommendations").select("extra_id").in("extra_id", extraIds),
        // RLS only surfaces this shop's own interests, so these counts are
        // "shifts at your shop", not a global tally.
        supabase
          .from("interests")
          .select("extra_id, announcements!inner(ends_at)")
          .eq("status", "accepted")
          .in("extra_id", extraIds),
      ])
    : [{ data: [] }, { data: [] }];

  const recommendationCounts = new Map<string, number>();
  for (const rec of (recData ?? []) as { extra_id: string }[]) {
    recommendationCounts.set(rec.extra_id, (recommendationCounts.get(rec.extra_id) ?? 0) + 1);
  }

  const shiftCounts = new Map<string, number>();
  for (const row of (shiftData ?? []) as unknown as {
    extra_id: string;
    announcements: { ends_at: string } | null;
  }[]) {
    if (row.announcements && row.announcements.ends_at < nowIso) {
      shiftCounts.set(row.extra_id, (shiftCounts.get(row.extra_id) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Baristas</h1>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted-foreground">
          <MapPin className="size-4" />
          Available baristas in your city
        </p>
      </div>

      {baristas.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No baristas available yet"
          description="When baristas in your city mark themselves as available, they'll show up here."
        />
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {baristas.map((barista) => {
            const name = barista.profiles?.display_name ?? "Barista";
            const recommendations = recommendationCounts.get(barista.id) ?? 0;
            const shifts = shiftCounts.get(barista.id) ?? 0;
            return (
              <li key={barista.id}>
                <Link
                  href={`/shop/baristas/${barista.id}`}
                  className="pressable block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar name={name} src={barista.profiles?.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{name}</p>
                        {barista.hourly_rate_cents != null ? (
                          <span className="shrink-0 rounded-md bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
                            {formatMoney(barista.hourly_rate_cents, barista.currency)}/hr
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">
                        {[
                          barista.years_experience != null
                            ? `${barista.years_experience} yrs experience`
                            : null,
                          barista.signature_drink ? `Signature: ${barista.signature_drink}` : null,
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
                      {recommendations > 0 || shifts > 0 ? (
                        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[13px]">
                          {recommendations > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-success">
                              <ThumbsUp className="size-3.5" />
                              {recommendations}{" "}
                              {recommendations === 1 ? "recommendation" : "recommendations"}
                            </span>
                          ) : null}
                          {shifts > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <CalendarCheck className="size-3.5" />
                              {shifts} {shifts === 1 ? "shift" : "shifts"} at your shop
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
