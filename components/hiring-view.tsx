import Link from "next/link";
import { AlarmClock, ArrowRight, MapPin } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { formatGigSchedule, formatMoney } from "@/lib/format";
import { skillLabel } from "@/lib/constants";
import type { Announcement } from "@/lib/database.types";

// The public hiring board: every open gig, no login, indexable. This is the
// page a barista can land on from a search for "barista jobs paris" — and the
// reason anyone outside the product has something to link to.

const COPY = {
  en: {
    title: "Barista shifts & jobs in Paris",
    sub: (n: number) =>
      n === 0
        ? "Nothing open right now — new shifts are posted every week."
        : `${n} open ${n === 1 ? "listing" : "listings"} from specialty cafés, updated as they're posted.`,
    sos: "SOS — needed urgently",
    perHour: "/hr",
    perMonth: "/month",
    apply: "Apply with a free profile",
    cta: "Baristas apply with a free profile — your shifts, reviews and reliability in one place.",
    ctaButton: "Create your profile",
    cafeLine: "Running a café?",
    cafeCta: "Post your own shift",
    guideLine: "New to freelancing in France?",
    guideCta: "Read the micro-entrepreneur guide",
    locale: "en-GB",
  },
  fr: {
    title: "Shifts et jobs de barista à Paris",
    sub: (n: number) =>
      n === 0
        ? "Rien d'ouvert pour l'instant — de nouveaux shifts sont publiés chaque semaine."
        : `${n} annonce${n === 1 ? "" : "s"} ouverte${n === 1 ? "" : "s"} de cafés de spécialité, mises à jour au fil de l'eau.`,
    sos: "SOS — besoin urgent",
    perHour: "/h",
    perMonth: "/mois",
    apply: "Postuler avec un profil gratuit",
    cta: "Les baristas postulent avec un profil gratuit — vos shifts, avis et fiabilité au même endroit.",
    ctaButton: "Créer votre profil",
    cafeLine: "Vous tenez un café ?",
    cafeCta: "Publiez votre propre shift",
    guideLine: "Nouveau dans le freelance en France ?",
    guideCta: "Lisez le guide micro-entrepreneur",
    locale: "fr-FR",
  },
} as const;

type BoardGig = Announcement & {
  coffee_shops: { name: string; address: string | null } | null;
};

function jobPostingJsonLd(gig: BoardGig, base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: gig.title,
    description: gig.description,
    datePosted: gig.created_at,
    validThrough: gig.ends_at,
    employmentType: gig.kind === "shift" ? "TEMPORARY" : gig.kind === "full_time" ? "FULL_TIME" : "PART_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: gig.coffee_shops?.name ?? "A specialty café",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: gig.coffee_shops?.address ?? undefined,
        addressLocality: "Paris",
        addressCountry: "FR",
      },
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: {
        "@type": "QuantitativeValue",
        value: gig.pay_rate_cents / 100,
        unitText: gig.pay_type === "hourly" ? "HOUR" : "MONTH",
      },
    },
    url: `${base}/hiring`,
  };
}

export async function HiringView({ locale }: { locale: "en" | "fr" }) {
  const t = COPY[locale];
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
  // Anonymous read of the public policies — no cookies, so the page can be
  // statically regenerated instead of rendered per-request.
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await supabase
    .from("announcements")
    .select("*, coffee_shops(name, address)")
    .eq("status", "open")
    .gte("ends_at", new Date().toISOString())
    .order("is_sos", { ascending: false })
    .order("starts_at");
  const gigs = (data ?? []) as unknown as BoardGig[];

  const signup = "/signup";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(gigs.map((gig) => jobPostingJsonLd(gig, base))),
        }}
      />

      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">{t.sub(gigs.length)}</p>

      <ul className="mt-8 flex flex-col gap-3">
        {gigs.map((gig) => (
          <li
            key={gig.id}
            className="rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {gig.is_sos ? (
                  <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-0.5 text-[12px] font-semibold text-danger">
                    <AlarmClock className="size-3.5" /> {t.sos}
                  </p>
                ) : null}
                <h2 className="font-display text-lg font-semibold tracking-tight">{gig.title}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  {gig.coffee_shops?.name}
                  {gig.coffee_shops?.address ? ` · ${gig.coffee_shops.address}` : ""}
                </p>
              </div>
              <p className="text-[15px] font-semibold tabular-nums">
                {formatMoney(gig.pay_rate_cents, "EUR")}
                <span className="text-[13px] font-normal text-muted-foreground">
                  {gig.pay_type === "hourly" ? t.perHour : t.perMonth}
                </span>
              </p>
            </div>

            <p className="mt-2 text-[13px] text-muted-foreground">
              {formatGigSchedule(gig, t.locale)}
            </p>
            {gig.required_skills.length > 0 ? (
              <p className="mt-2 flex flex-wrap gap-1.5">
                {gig.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[12px] text-muted-foreground"
                  >
                    {skillLabel(skill)}
                  </span>
                ))}
              </p>
            ) : null}

            <Link
              href={signup}
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium underline-offset-2 hover:underline"
            >
              {t.apply} <ArrowRight className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-[15px]">{t.cta}</p>
        <Link
          href={signup}
          className="pressable mt-4 inline-flex h-10 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground"
        >
          {t.ctaButton}
        </Link>
        <p className="mt-3 text-[13px] text-muted-foreground">
          {t.guideLine}{" "}
          <Link
            href={locale === "fr" ? "/fr/guides/freelance-barista-france" : "/guides/freelance-barista-france"}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t.guideCta}
          </Link>
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t.cafeLine}{" "}
          <Link href="/for-cafes" className="underline underline-offset-2 hover:text-foreground">
            {t.cafeCta}
          </Link>
        </p>
      </div>
    </div>
  );
}
