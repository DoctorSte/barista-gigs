import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Gift,
  MapPin,
  MessageSquare,
  Search,
  Siren,
  Sparkles,
  Stamp,
  UserRound,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PlanCards } from "@/components/plan-cards";
import { CtaBand, FaqJsonLd, FaqSection, FeatureGrid } from "@/components/marketing";
import {
  FOR_BARISTAS_COPY,
  FOR_CAFES_COPY,
  LANDING_COPY,
  type Locale,
  type PassportCopy,
} from "@/lib/marketing-copy";

/** Locale-aware renderings of the marketing pages. Copy lives in
 *  lib/marketing-copy.ts; icons and layout live here. */

function withIcons<T extends { title: string; body: string }>(
  copy: T[],
  icons: LucideIcon[],
) {
  return copy.map((feature, index) => ({ ...feature, icon: icons[index] ?? Sparkles }));
}

function PassportBand({ copy }: { copy: PassportCopy }) {
  return (
    <div className="pp-teaser relative overflow-hidden rounded-xl px-6 py-12 sm:px-12">
      <div className="relative z-10 flex flex-col items-start gap-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <p className="pp-teaser-label mb-3">{copy.label}</p>
          <h2 className="pp-teaser-foil font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.heading}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#c9bfa8]">{copy.body}</p>
          <Link
            href="/signup?role=extra"
            className="pressable mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#d4b36a] px-6 text-[15px] font-medium text-[#1e3a2f] hover:bg-[#edd9a3]"
          >
            {copy.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {/* Stamp cluster — pure CSS keepsakes from the real passport. */}
        <div aria-hidden className="relative mx-auto h-44 w-56 shrink-0 select-none sm:mx-0 sm:mr-4">
          <div className="pp-teaser-stamp absolute left-0 top-2 flex size-28 -rotate-12 flex-col items-center justify-center rounded-full text-center">
            <span className="font-mono text-[8px] tracking-[0.22em]">CAFÉ LUEUR</span>
            <span className="mt-1 font-display text-lg font-semibold leading-none">29</span>
            <span className="font-mono text-[8px] tracking-[0.22em]">AUG · PARIS</span>
          </div>
          <div className="pp-teaser-stamp pp-teaser-stamp-alt absolute right-0 top-0 flex size-24 rotate-6 flex-col items-center justify-center rounded-full text-center">
            <span className="font-mono text-[8px] tracking-[0.22em]">BRUNCH RUSH</span>
            <span className="mt-1 font-display text-base font-semibold leading-none">16</span>
            <span className="font-mono text-[8px] tracking-[0.22em]">COVERED</span>
          </div>
          {/* 96×84px — exact multiples of the 12px perf grid, so scallops stay even. */}
          <div className="pp-teaser-hover absolute bottom-0 left-1/2 h-[84px] w-24 -translate-x-1/2 rotate-3">
            <div className="pp-teaser-postage absolute inset-0" />
            <div className="absolute inset-[5px] flex items-center justify-center bg-[#f2ead8]">
              <Image src="/mascot.png" alt="" width={300} height={277} className="h-auto w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingView({ locale }: { locale: Locale }) {
  const t = LANDING_COPY[locale];
  const prefix = locale === "fr" ? "/fr" : "";
  const cafeFeatures = withIcons(t.cafeFeatures, [Siren, BadgeCheck, Users]);
  const baristaFeatures = withIcons(t.baristaFeatures, [Stamp, MapPin, Gift]);

  return (
    <div lang={locale} className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="stagger flex flex-col items-center gap-6 pb-20 pt-16 text-center sm:pt-24">
        <Image
          src="/mascot.png"
          alt="Barista Gigs mascot"
          width={300}
          height={277}
          priority
          className="h-auto w-36 sm:w-44"
        />
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-accent" />
          {t.badge}
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          {t.heroLine1}
          <br />
          <em className="text-accent">{t.heroLine2}</em>
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">{t.heroSub}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=extra"
            className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.ctaFindGigs}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center rounded-md border border-border-strong bg-surface px-6 text-[15px] font-medium hover:bg-muted"
          >
            {t.ctaStaffBar}
          </Link>
        </div>
        <p className="text-sm font-medium text-success">{t.freeLine}</p>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {t.steps.map((step) => (
            <div key={step.number} className="hover-raise rounded-lg border border-border bg-surface p-6">
              <p className="mb-4 font-mono text-[13px] font-medium tracking-[0.2em] text-accent">
                {step.number}
              </p>
              <h3 className="mb-1.5 font-display text-lg font-semibold">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Both sides of the bar */}
      <section className="border-t border-border py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          {[
            {
              eyebrow: t.cafesEyebrow,
              heading: t.cafesHeading,
              features: cafeFeatures,
              link: t.cafesLink,
              href: `${prefix}/for-cafes`,
            },
            {
              eyebrow: t.baristasEyebrow,
              heading: t.baristasHeading,
              features: baristaFeatures,
              link: t.baristasLink,
              href: `${prefix}/for-baristas`,
            },
          ].map((column) => (
            <div key={column.href}>
              <p className="mb-2 font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {column.eyebrow}
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {column.heading}
              </h2>
              <div className="mt-5 flex flex-col gap-3">
                {column.features.map((feature) => (
                  <div key={feature.title} className="flex gap-3.5 rounded-lg border border-border bg-surface p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <feature.icon className="size-4.5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="font-medium">{feature.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={column.href}
                className="pressable mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent hover:underline"
              >
                {column.link} <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Passport band */}
      <section className="pb-16">
        <PassportBand copy={t.passport} />
      </section>

      {/* Pricing */}
      <section className="border-t border-border py-16">
        <div className="mx-auto flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              {t.pricingHeading}
            </h2>
            <p className="text-muted-foreground">{t.pricingSub}</p>
          </div>
          <PlanCards locale={locale} />
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            {t.ctaStartHiring}
          </Link>
        </div>
      </section>
    </div>
  );
}

export function ForCafesView({ locale }: { locale: Locale }) {
  const t = FOR_CAFES_COPY[locale];
  const features = withIcons(t.features, [
    CalendarClock,
    Siren,
    BadgeCheck,
    Search,
    Users,
    Gift,
  ]);

  return (
    <div lang={locale} className="mx-auto max-w-5xl px-4 sm:px-6">
      <FaqJsonLd faqs={t.faqs} />

      <section className="stagger flex flex-col items-center gap-5 pb-16 pt-16 text-center sm:pt-20">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t.eyebrow}
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          {t.heroTitle1}
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">{t.heroSub}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            {t.ctaPrimary}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={t.ctaSecondaryHref}
            className="pressable inline-flex h-11 items-center rounded-md border border-border-strong bg-surface px-6 text-[15px] font-medium hover:bg-muted"
          >
            {t.ctaSecondary}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{t.heroNote}</p>
      </section>

      <section className="border-t border-border py-16">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">
          {t.featuresHeading}
        </h2>
        <FeatureGrid features={features} />
      </section>

      <section className="pb-16">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-8 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MessageSquare className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">{t.messagingTitle}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
              {t.messagingBody}
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t border-border py-16">
        <div className="mx-auto flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              {t.pricingHeading}
            </h2>
            <p className="text-muted-foreground">{t.pricingSub}</p>
          </div>
          <PlanCards locale={locale} />
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            {t.ctaStartHiring}
          </Link>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <FaqSection faqs={t.faqs} heading={t.faqHeading} />
      </section>

      <section className="pb-16">
        <CtaBand
          title={t.finalCta.title}
          body={t.finalCta.body}
          ctaLabel={t.finalCta.ctaLabel}
          ctaHref="/signup?role=shop"
        />
      </section>
    </div>
  );
}

export function ForBaristasView({ locale }: { locale: Locale }) {
  const t = FOR_BARISTAS_COPY[locale];
  const features = withIcons(t.features, [UserRound, Zap, BadgeCheck, Wallet, Briefcase, Gift]);

  return (
    <div lang={locale} className="mx-auto max-w-5xl px-4 sm:px-6">
      <FaqJsonLd faqs={t.faqs} />

      <section className="stagger flex flex-col items-center gap-5 pb-16 pt-16 text-center sm:pt-20">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t.eyebrow}
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          {t.heroTitle1}
          {t.heroTitle2 ? (
            <>
              <br />
              <em className="text-accent">{t.heroTitle2}</em>
            </>
          ) : null}
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">{t.heroSub}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=extra"
            className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.ctaPrimary}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={t.ctaSecondaryHref}
            className="pressable inline-flex h-11 items-center rounded-md border border-border-strong bg-surface px-6 text-[15px] font-medium hover:bg-muted"
          >
            {t.ctaSecondary}
          </Link>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" /> {t.heroNote}
        </p>
      </section>

      <section className="border-t border-border py-16">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">
          {t.featuresHeading}
        </h2>
        <FeatureGrid features={features} />
      </section>

      <section className="pb-16">
        <PassportBand copy={t.passport} />
      </section>

      <section className="border-t border-border py-16">
        <FaqSection faqs={t.faqs} heading={t.faqHeading} />
      </section>

      <section className="pb-16">
        <CtaBand
          title={t.finalCta.title}
          body={t.finalCta.body}
          ctaLabel={t.finalCta.ctaLabel}
          ctaHref="/signup?role=extra"
        />
      </section>
    </div>
  );
}
