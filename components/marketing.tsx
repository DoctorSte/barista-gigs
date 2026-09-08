import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/** Building blocks shared by the marketing pages (/, /for-cafes, /for-baristas). */

export type Feature = { icon: LucideIcon; title: string; body: string };

export function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div key={feature.title} className="hover-raise rounded-lg border border-border bg-surface p-6">
          <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <feature.icon className="size-5" strokeWidth={1.75} />
          </span>
          <h3 className="mb-1.5 font-display text-lg font-semibold">{feature.title}</h3>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{feature.body}</p>
        </div>
      ))}
    </div>
  );
}

export type Faq = { question: string; answer: string };

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-center font-display text-3xl font-semibold tracking-tight">
        Questions, answered
      </h2>
      <div className="flex flex-col gap-2.5">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-lg border border-border bg-surface px-5 py-4"
          >
            <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {faq.question}
                <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-90">
                  ›
                </span>
              </span>
            </summary>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

/** FAQPage structured data for the same list rendered by FaqSection. */
export function FaqJsonLd({ faqs }: { faqs: Faq[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function CtaBand({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-accent/25 bg-accent-soft/50 px-6 py-12 text-center">
      <h2 className="font-display text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-[15px] text-muted-foreground">{body}</p>
      <Link
        href={ctaHref}
        className="pressable mt-1 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-6 text-[15px] font-medium text-accent-foreground hover:bg-accent/90"
      >
        {ctaLabel}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
