import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { getSession, homeForRole } from "@/lib/auth";
import { PLANS, type Plan } from "@/lib/plans";

const STEPS = [
  {
    number: "01",
    title: "Post the shift",
    body: "Cafés publish gigs with dates, pay, and the skills the bar needs — from dialing in to latte art.",
  },
  {
    number: "02",
    title: "Baristas raise a hand",
    body: "Freelance baristas in your city browse open gigs and pitch themselves in one tap.",
  },
  {
    number: "03",
    title: "Match and message",
    body: "Accept the right fit and sort the details in chat. No agencies, no spreadsheets.",
  },
];

function planFeatures(plan: Plan): string[] {
  return [
    plan.gigsPerMonth ? `${plan.gigsPerMonth} gigs a month` : "Unlimited gigs",
    plan.locations === 1 ? "1 location" : `Up to ${plan.locations} locations`,
    plan.teamAccounts === 1 ? "Single account" : `${plan.teamAccounts} team accounts`,
    "Barista directory",
    "Referral free months",
  ];
}

export default async function LandingPage() {
  const { profile } = await getSession();
  if (profile) redirect(homeForRole(profile.role));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="stagger flex flex-col items-center gap-6 pb-20 pt-16 text-center sm:pt-24">
        <Image
          src="/mascot.png"
          alt="The Barista Gigs mascot — a leafy bush in a cap, running with a coffee"
          width={300}
          height={277}
          priority
          className="h-auto w-36 sm:w-44"
        />
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-accent" />
          Now pouring in Paris — any city welcome
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Great coffee needs
          <br />
          <em className="text-accent">great hands.</em>
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Barista Gigs connects specialty cafés with skilled freelance
          baristas for one-off shifts. Post a gig, find your extra, pour on.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=extra"
            className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Find gigs
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center rounded-md border border-border-strong bg-surface px-6 text-[15px] font-medium hover:bg-muted"
          >
            Staff your bar
          </Link>
        </div>
      </section>

      {/* How it works — a real sequence, so the steps are numbered. */}
      <section className="border-t border-border py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="hover-raise rounded-lg border border-border bg-surface p-6"
            >
              <p className="mb-4 font-mono text-[13px] font-medium tracking-[0.2em] text-accent">
                {step.number}
              </p>
              <h3 className="mb-1.5 font-display text-lg font-semibold">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Barista Passport — free side of the marketplace, and the thing nobody else has. */}
      <section className="pb-16">
        <div className="pp-teaser relative overflow-hidden rounded-xl px-6 py-12 sm:px-12">
          <div className="relative z-10 flex flex-col items-start gap-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="pp-teaser-label mb-3">Free for baristas · forever</p>
              <h2 className="pp-teaser-foil font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Every shift earns a stamp.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#c9bfa8]">
                Work a gig, and the café goes into your Barista Passport — a shareable page of
                stamps, latte art, and the bars you&apos;ve run. Your career, documented.
              </p>
              <Link
                href="/signup?role=extra"
                className="pressable mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#d4b36a] px-6 text-[15px] font-medium text-[#1e3a2f] hover:bg-[#edd9a3]"
              >
                Start your passport
                <ArrowRight className="size-4" />
              </Link>
            </div>
            {/* Stamp cluster — pure CSS keepsakes from the real passport. */}
            <div
              aria-hidden
              className="relative mx-auto h-44 w-56 shrink-0 select-none sm:mx-0 sm:mr-4"
            >
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
              <div className="pp-teaser-hover absolute bottom-0 left-1/2 h-20 w-24 -translate-x-1/2 rotate-3">
                <div className="pp-teaser-postage absolute inset-0" />
                <div className="absolute inset-[6px] flex items-center justify-center bg-[#f2ead8]">
                  <Image
                    src="/mascot.png"
                    alt=""
                    width={300}
                    height={277}
                    className="h-auto w-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border py-16">
        <div className="mx-auto flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Simple pricing for cafés
            </h2>
            <p className="text-muted-foreground">
              Free for baristas, always. Cafés pick the plan that fits their bar.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-3">
            {[PLANS.occasional, PLANS.regular, PLANS.group].map((plan) => {
              const highlighted = plan.id === "regular";
              return (
                <div
                  key={plan.id}
                  className={
                    highlighted
                      ? "hover-raise relative flex flex-col rounded-lg border border-accent bg-surface p-6 text-left"
                      : "hover-raise flex flex-col rounded-lg border border-border bg-surface p-6 text-left"
                  }
                >
                  {highlighted ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
                      Most popular
                    </span>
                  ) : null}
                  <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-3 font-display text-3xl font-semibold">
                    €{plan.monthlyCents / 100}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    or €{plan.yearlyCents / 100}/year — 2 months free
                  </p>
                  <ul className="mt-5 flex flex-col gap-2 text-[14px] text-muted-foreground">
                    {planFeatures(plan).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="size-4 shrink-0 text-success" strokeWidth={2.5} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            Start hiring
          </Link>
        </div>
      </section>
    </div>
  );
}
