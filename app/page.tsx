import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarClock, Coffee, MessageSquare, Sparkles } from "lucide-react";
import { getSession, homeForRole } from "@/lib/auth";
import { getFeaturedCities } from "@/lib/city";
import { SUBSCRIPTION_PRICE_EUR } from "@/lib/constants";

export default async function LandingPage() {
  const { profile } = await getSession();
  if (profile) redirect(homeForRole(profile.role));

  const cities = await getFeaturedCities();

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
          Now in {cities.length > 0 ? `${cities.length} European cities` : "Europe"}
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Great coffee needs
          <br />
          <em className="text-accent">great hands.</em>
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Barista Gigs connects specialty coffee shops with skilled freelance
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

      {/* Cities */}
      {cities.length > 0 ? (
        <section className="border-t border-border py-10">
          <p className="mb-4 text-center text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
            Live in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display text-lg text-muted-foreground">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={`/cities/${city.slug}`}
                className="pressable transition-colors duration-150 hover:text-foreground"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="grid gap-4 border-t border-border py-16 sm:grid-cols-3">
        {[
          {
            icon: CalendarClock,
            title: "Post the shift",
            body: "Shops publish gigs with dates, pay, and the skills the bar needs — from dialing in to latte art.",
          },
          {
            icon: Coffee,
            title: "Baristas raise a hand",
            body: "Freelance baristas in your city browse open gigs and pitch themselves in one message.",
          },
          {
            icon: MessageSquare,
            title: "Match and message",
            body: "Accept the right fit and sort the details in chat. No agencies, no spreadsheets.",
          },
        ].map((step) => (
          <div key={step.title} className="rounded-lg border border-border bg-surface p-6">
            <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
              <step.icon className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="mb-1.5 font-display text-lg font-semibold">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="border-t border-border py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-lg border border-border bg-surface p-10 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Simple pricing for shops
          </h2>
          <p className="text-muted-foreground">
            Free for baristas, always. Shops subscribe to post unlimited gigs.
          </p>
          <p className="font-display text-5xl font-semibold">
            €{SUBSCRIPTION_PRICE_EUR}
            <span className="text-lg font-normal text-muted-foreground">/month</span>
          </p>
          <Link
            href="/signup?role=shop"
            className="pressable mt-2 inline-flex h-11 items-center rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            Start hiring
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2 border-t border-border py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Barista Gigs</p>
        <p className="font-display italic">Pour decisions welcome.</p>
      </footer>
    </div>
  );
}
