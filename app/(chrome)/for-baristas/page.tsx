import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Gift,
  MapPin,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import {
  CtaBand,
  FaqJsonLd,
  FaqSection,
  FeatureGrid,
  type Faq,
  type Feature,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Freelance barista gigs — free, no commission",
  description:
    "Find paid barista shifts at specialty cafés in your city. Free forever, no commission on your pay, one-tap applications, and a shareable Barista Passport that documents every shift.",
  alternates: { canonical: "/for-baristas" },
  openGraph: {
    title: "Barista Gigs for baristas — your craft, on your terms",
    description:
      "Find paid barista shifts at specialty cafés in your city. Free forever, no commission, and a Barista Passport that documents every shift.",
  },
};

const FEATURES: Feature[] = [
  {
    icon: UserRound,
    title: "One profile, all your rates",
    body: "Bio, skills, portfolio, languages, CV, and separate rates for regular shifts, events, or training — cafés see exactly what you offer.",
  },
  {
    icon: Zap,
    title: "Apply in one tap",
    body: "Your profile is your pitch. See a gig you like — on the list or the map — and raise your hand. A message is optional.",
  },
  {
    icon: BadgeCheck,
    title: "A track record that travels",
    body: "Cafés confirm your shifts and review your work. Confirmed shifts, show-up rate, and stars follow you to every application.",
  },
  {
    icon: Wallet,
    title: "Your pay stays yours",
    body: "Cafés pay you directly, however you agree — cash, transfer, invoice. We never touch it and never take a percentage.",
  },
  {
    icon: Briefcase,
    title: "Gigs today, jobs tomorrow",
    body: "Alongside one-off shifts, cafés post full-time and part-time roles. Attach your CV and apply from the same profile.",
  },
  {
    icon: Gift,
    title: "€50 for every café you bring",
    body: "Know a café that should be hiring here? Share your link — when they subscribe, you get a €50 cash bonus.",
  },
];

const FAQS: Faq[] = [
  {
    question: "Does it cost anything?",
    answer:
      "No. Barista Gigs is free for baristas, forever — no subscription, no commission, no fees on your pay. Cafés pay a subscription to post gigs.",
  },
  {
    question: "How do I get paid?",
    answer:
      "Directly by the café, using whatever method you both agree. Your profile has a private payment-details field that's only shown to cafés that accepted you for a gig.",
  },
  {
    question: "What is the Barista Passport?",
    answer:
      "A shareable public page of your career: stamps from the cafés you've worked at, your latte art, and your story. Pick a username and it goes live at your own link.",
  },
  {
    question: "Do I need years of experience?",
    answer:
      "No minimum. Your profile shows your real skills and rates, and your track record builds with every confirmed shift — cafés decide what fits their bar.",
  },
  {
    question: "What about taxes and freelance status?",
    answer:
      "You work with cafés directly, so registering as a freelancer and declaring income works exactly as it does for any freelance work in your country. That part is between you and the café.",
  },
  {
    question: "Which cities does it work in?",
    answer:
      "We're starting in Paris, but any city is welcome — set your city and you'll see every gig posted there.",
  },
];

export default function ForBaristasPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <FaqJsonLd faqs={FAQS} />

      {/* Hero */}
      <section className="stagger flex flex-col items-center gap-5 pb-16 pt-16 text-center sm:pt-20">
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          For baristas
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Pour where you&rsquo;re needed.
          <br />
          <em className="text-accent">Keep every euro.</em>
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Paid shifts at specialty cafés in your city — sick-day covers, event bars, brunch
          rushes. Free forever, with no commission on your pay and a passport that proves your
          craft.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup?role=extra"
            className="pressable inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your free profile
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/gigs"
            className="pressable inline-flex h-11 items-center rounded-md border border-border-strong bg-surface px-6 text-[15px] font-medium hover:bg-muted"
          >
            Browse gigs
          </Link>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" /> Live in Paris — any city welcome
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold tracking-tight">
          Built for working baristas
        </h2>
        <FeatureGrid features={FEATURES} />
      </section>

      {/* Passport band — the signature. */}
      <section className="pb-16">
        <div className="pp-teaser relative overflow-hidden rounded-xl px-6 py-12 sm:px-12">
          <div className="relative z-10 flex flex-col items-start gap-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="pp-teaser-label mb-3">Your career, documented</p>
              <h2 className="pp-teaser-foil font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Every shift earns a stamp.
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#c9bfa8]">
                Each confirmed shift stamps your Barista Passport with the café&rsquo;s mark. Add
                your latte art, pick a username, and share one link that shows everywhere
                you&rsquo;ve poured.
              </p>
              <Link
                href="/signup?role=extra"
                className="pressable mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-[#d4b36a] px-6 text-[15px] font-medium text-[#1e3a2f] hover:bg-[#edd9a3]"
              >
                Start your passport
                <ArrowRight className="size-4" />
              </Link>
            </div>
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
              <div className="pp-teaser-hover absolute bottom-0 left-1/2 h-[84px] w-24 -translate-x-1/2 rotate-3">
                <div className="pp-teaser-postage absolute inset-0" />
                <div className="absolute inset-[5px] flex items-center justify-center bg-[#f2ead8]">
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

      {/* FAQ */}
      <section className="border-t border-border py-16">
        <FaqSection faqs={FAQS} />
      </section>

      {/* Final CTA */}
      <section className="pb-16">
        <CtaBand
          title="The bar is waiting"
          body="Set up your profile in five minutes and start hearing from cafés in your city. Free, forever."
          ctaLabel="Create your free profile"
          ctaHref="/signup?role=extra"
        />
      </section>
    </div>
  );
}
