import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Gift,
  MessageSquare,
  Search,
  Siren,
  Users,
} from "lucide-react";
import { PlanCards } from "@/components/plan-cards";
import {
  CtaBand,
  FaqJsonLd,
  FaqSection,
  FeatureGrid,
  type Faq,
  type Feature,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Hire freelance baristas for one-off shifts",
  description:
    "Post a shift, hear from experienced freelance baristas in your city, and cover the bar — with track records, reviews, and SOS mode for emergencies. Plans from €15/month.",
  alternates: { canonical: "/for-cafes" },
  openGraph: {
    title: "Barista Gigs for cafés — coffee shifts, covered",
    description:
      "Post a shift, hear from experienced freelance baristas in your city, and cover the bar. Plans from €15/month.",
  },
};

const FEATURES: Feature[] = [
  {
    icon: CalendarClock,
    title: "Post a gig in minutes",
    body: "Single shifts or multi-date runs, hourly or flat pay, and the exact skills your bar needs — from dialing in to latte art.",
  },
  {
    icon: Siren,
    title: "SOS mode for emergencies",
    body: "Someone called in sick before the morning rush? Mark the gig SOS and every available barista in your city gets alerted.",
  },
  {
    icon: BadgeCheck,
    title: "Track records, not promises",
    body: "Every applicant shows confirmed shifts, show-up rate, and star reviews from other cafés. After each shift, you confirm who worked and review them back.",
  },
  {
    icon: Search,
    title: "A directory you can work",
    body: "Browse every available barista in your city. Filter by skill and rate, save your favourites, invite them straight to a gig, and rebook the ones you loved.",
  },
  {
    icon: Users,
    title: "Team accounts & locations",
    body: "Invite your managers to share the workspace — gigs, applicants, messages — while billing stays with you. The Group plan covers up to three locations.",
  },
  {
    icon: Gift,
    title: "Referrals pay your bill",
    body: "Share your referral link with café friends. Every café that subscribes through it earns you a free month, automatically.",
  },
];

const FAQS: Faq[] = [
  {
    question: "Do you employ the baristas?",
    answer:
      "No. Barista Gigs is a marketplace: you and the barista agree on the shift, pay, and conditions directly. We're not a staffing agency and we never take a cut of the barista's pay.",
  },
  {
    question: "What does it cost?",
    answer:
      "Plans start at €15/month (or €149/year) for up to 3 gigs a month. The Regular plan at €25/month has unlimited gigs, and Group at €49/month adds up to three locations and ten team accounts. Cancel anytime.",
  },
  {
    question: "How do I know a barista is good?",
    answer:
      "Every profile shows skills, experience, rates, portfolio photos, and a track record built on this platform: shifts confirmed by cafés, show-up rate, star reviews, and recommendations from cafés they've worked for.",
  },
  {
    question: "How is payment handled?",
    answer:
      "You pay the barista directly, however you both agree — accepted baristas share their payment details with you. Your subscription is the only thing Barista Gigs ever charges.",
  },
  {
    question: "Which cities does it work in?",
    answer:
      "We're starting in Paris, but any city is welcome — set your café's city and baristas who join there will see your gigs.",
  },
  {
    question: "Can I hire for permanent roles too?",
    answer:
      "Yes — alongside one-off gigs you can post full-time and part-time job listings, with CVs attached to applications.",
  },
];

export default function ForCafesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <FaqJsonLd faqs={FAQS} />

      {/* Hero */}
      <section className="stagger flex flex-col items-center gap-5 pb-16 pt-16 text-center sm:pt-20">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          For cafés
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Staff your bar without the agency.
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Post a shift, hear from experienced freelance baristas in your city, and pick the right
          hands — with real track records to go on. From sick-day SOS to fashion-week pop-ups.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            Start hiring
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#pricing"
            className="pressable inline-flex h-11 items-center rounded-md border border-border-strong bg-surface px-6 text-[15px] font-medium hover:bg-muted"
          >
            See pricing
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          From €15/month · unlimited applicants · cancel anytime
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">
          Everything between &ldquo;we&rsquo;re short&rdquo; and &ldquo;we&rsquo;re covered&rdquo;
        </h2>
        <FeatureGrid features={FEATURES} />
      </section>

      {/* Messaging note */}
      <section className="pb-16">
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-8 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MessageSquare className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">
              Sort the details in chat, keep everything in one place
            </h2>
            <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
              Accepting an applicant opens a message thread — agree timing, dress code, and pay
              without switching to phone numbers and lost texts. Your whole team sees the same
              inbox.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-border py-16">
        <div className="mx-auto flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              One flat price. No commissions.
            </h2>
            <p className="text-muted-foreground">
              Baristas keep every euro they earn — you pay a subscription, nothing per hire.
            </p>
          </div>
          <PlanCards />
          <Link
            href="/signup?role=shop"
            className="pressable inline-flex h-11 items-center rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            Start hiring
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-16">
        <FaqSection faqs={FAQS} />
      </section>

      {/* Final CTA */}
      <section className="pb-16">
        <CtaBand
          title="Your next shift is one post away"
          body="Create your café's profile, post your first gig, and meet the baristas keeping your city caffeinated."
          ctaLabel="Create a café account"
          ctaHref="/signup?role=shop"
        />
      </section>
    </div>
  );
}
