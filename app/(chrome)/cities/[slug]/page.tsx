import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, Coffee, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatGigSchedule, formatPay } from "@/lib/format";
import { skillLabel } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Announcement, City } from "@/lib/database.types";

type CityGig = Announcement & {
  coffee_shops: { name: string; address: string } | null;
};

const getCity = cache(async (slug: string): Promise<City | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("cities").select("*").eq("slug", slug).maybeSingle();
  return (data as City | null) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCity(slug);
  if (!city) return { title: "City not found" };
  return { title: `Barista gigs in ${city.name}` };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await getCity(slug);
  if (!city || !city.is_active) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, coffee_shops(name, address)")
    .eq("city_id", city.id)
    .eq("status", "open")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at");

  const gigs = (data ?? []) as unknown as CityGig[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="stagger mb-10 flex flex-col items-start gap-3">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[13px] font-medium text-muted-foreground">
          <MapPin className="size-3.5 text-accent" />
          {city.name}, {city.country_code}
        </p>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Barista gigs in {city.name}
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          One-off shifts at specialty coffee shops — posted by the cafés themselves.
        </p>
      </div>

      {gigs.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title={`No open gigs in ${city.name} right now`}
          description="Be the first café to post one."
        />
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {gigs.map((gig) => (
            <li key={gig.id}>
              <Link
                href="/signup"
                className="pressable block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      {gig.coffee_shops?.name ?? "Coffee shop"}
                    </p>
                    <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight">
                      {gig.title}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-md bg-accent-soft px-2.5 py-1 text-sm font-semibold text-accent">
                    {formatPay(gig.pay_rate_cents, gig.pay_type)}
                  </span>
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" />
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

      <Card className="rise-in mt-10 flex flex-col items-center gap-4 p-10 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Work these shifts</h2>
        <p className="max-w-md text-muted-foreground">
          Create a free barista profile to see full gig details and pitch yourself in one message.
        </p>
        <Link
          href="/signup"
          className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Join Barista Gigs
          <ArrowRight className="size-4" />
        </Link>
        <p className="text-sm text-muted-foreground">
          Run a café in {city.name}?{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            Post your first gig
          </Link>
        </p>
      </Card>
    </div>
  );
}
