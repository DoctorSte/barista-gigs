import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

// The freelance-barista guide: how to work paid café shifts in France as a
// micro-entrepreneur. Genuinely useful reference content — the kind of page
// that earns links and qualifies supply before they ever sign up.
//
// A sponsor slot exists but ships empty; `sponsor=preview` renders a
// clearly-labelled mock placement for pitching partners. Nothing on the live
// page claims a partnership that doesn't exist.

const COPY = {
  en: {
    eyebrow: "GUIDE · FRANCE",
    title: "Working freelance barista shifts in France",
    intro:
      "Cafés pay freelance baristas per shift, but in France that means invoicing as a business — most baristas use micro-entrepreneur status. Here is the whole path, from registration to your first invoice, in plain words.",
    updated: "Checked September 2026 · sources linked below",
    steps: [
      {
        title: "Register as a micro-entrepreneur (free, online)",
        body: "Declare your activity on the official portal — it takes about 20 minutes and costs nothing. Pick a service activity (« services de restauration », barista services). You'll receive a SIRET number within a couple of weeks; that number is what lets you invoice a café legally. Beware of look-alike sites that charge for this: the official registration is free.",
      },
      {
        title: "Know what you'll pay",
        body: "You pay social contributions as a percentage of what you invoice — for service activities around a fifth of turnover (21.2% as of 2025 — check the current rate on the URSSAF site). No revenue, no contributions. First-time creators may qualify for ACRE, which roughly halves contributions in year one. After your first year you may also owe a small local business tax (CFE).",
      },
      {
        title: "Skip VAT while you're small",
        body: "Below the annual threshold for services you don't charge VAT at all (« franchise en base de TVA »). Your invoices must then carry the line « TVA non applicable, art. 293 B du CGI ». Verify the current threshold on the official site — it has been debated recently.",
      },
      {
        title: "Invoice properly",
        body: "Every shift ends with an invoice: your name and SIRET, the café's details, an invoice number in sequence, date, description (« prestation barista, service du 14 sept, 7h–14h »), hourly rate, total, and the VAT line above. Payment terms are whatever you agree — on Barista Gigs the café pays you directly; the platform never holds your money.",
      },
      {
        title: "Declare your turnover — even zero",
        body: "You declare what you invoiced monthly or quarterly on the URSSAF autoentrepreneur portal, and contributions are taken from that. Declare even when it's €0 — skipping declarations gets you fined and eventually deregistered.",
      },
    ],
    watchTitle: "One thing to take seriously",
    watchBody:
      "Freelancing means multiple clients and real independence. If you work fixed hours for a single café for months, under their direction, that can be reclassified as disguised employment (« salariat déguisé ») — a problem for the café more than for you, but a real one. Varied shifts across different cafés — which is what this platform is for — is exactly what keeps the arrangement clean. For a permanent role, ask for a contract instead.",
    ratesTitle: "What do shifts pay?",
    ratesBody:
      "Specialty cafés in Paris currently list freelance shifts between €18 and €28 per hour depending on experience and urgency. Remember contributions come out of that — €24/h invoiced is roughly €19/h after contributions, before income tax.",
    insuranceTitle: "Insurance",
    insuranceBody:
      "Professional liability insurance (RC Pro) isn't legally required for barista work, but it's cheap and some cafés ask for it. Worth having once you work regularly.",
    sourcesTitle: "Official sources",
    sources: [
      { label: "URSSAF — auto-entrepreneur portal", href: "https://www.autoentrepreneur.urssaf.fr" },
      { label: "Registering your business (guichet unique)", href: "https://formalites.entreprises.gouv.fr" },
      { label: "Service-Public — micro-entrepreneur", href: "https://www.service-public.fr/particuliers/vosdroits/F23961" },
    ],
    disclaimer:
      "This guide is general information, not legal or tax advice. Rules and rates change — always confirm against the official sources above.",
    ctaTitle: "Ready to pour?",
    ctaBody: "Open shifts at Paris specialty cafés are public — pay listed up front.",
    ctaBrowse: "See open shifts",
    ctaJoin: "Create a free profile",
    sponsorLabel: "PROPOSED SPONSOR PLACEMENT — PREVIEW, NOT LIVE",
    sponsorTitle: "In partnership with Shine",
    sponsorBody:
      "Shine is the French business account built for micro-entrepreneurs — registration help, invoicing, and URSSAF reminders in one app. Example copy: “Open your micro-entrepreneur account with Shine and invoice your first shift this week.”",
    sponsorCta: "Example CTA → shine.fr",
  },
  fr: {
    eyebrow: "GUIDE · FRANCE",
    title: "Travailler comme barista freelance en France",
    intro:
      "Les cafés paient les baristas freelance au shift, mais en France cela veut dire facturer comme une entreprise — la plupart des baristas passent par le statut de micro-entrepreneur. Voici le chemin complet, de l'immatriculation à la première facture, en langage clair.",
    updated: "Vérifié en septembre 2026 · sources en bas de page",
    steps: [
      {
        title: "S'immatriculer comme micro-entrepreneur (gratuit, en ligne)",
        body: "Déclarez votre activité sur le portail officiel — environ 20 minutes, sans frais. Choisissez une activité de services (prestations barista). Vous recevrez un numéro SIRET sous quelques semaines ; c'est lui qui vous permet de facturer un café légalement. Méfiez-vous des sites imitations payants : l'immatriculation officielle est gratuite.",
      },
      {
        title: "Savoir ce que vous paierez",
        body: "Vous payez des cotisations sociales en pourcentage de ce que vous facturez — pour les prestations de services, environ un cinquième du chiffre d'affaires (21,2 % en 2025 — vérifiez le taux en vigueur sur le site de l'URSSAF). Pas de revenus, pas de cotisations. Les créateurs peuvent bénéficier de l'ACRE, qui réduit les cotisations la première année. Après la première année, une petite taxe locale (CFE) peut s'appliquer.",
      },
      {
        title: "Pas de TVA tant que vous êtes petit",
        body: "Sous le seuil annuel des prestations de services, vous ne facturez pas de TVA (« franchise en base »). Vos factures doivent alors porter la mention « TVA non applicable, art. 293 B du CGI ». Vérifiez le seuil en vigueur sur le site officiel — il a récemment fait débat.",
      },
      {
        title: "Facturer proprement",
        body: "Chaque shift se termine par une facture : votre nom et SIRET, les coordonnées du café, un numéro de facture séquentiel, la date, la description (« prestation barista, service du 14 sept, 7h–14h »), le taux horaire, le total, et la mention TVA ci-dessus. Les délais de paiement sont ceux que vous convenez — sur Barista Gigs, le café vous paie directement ; la plateforme ne touche jamais votre argent.",
      },
      {
        title: "Déclarer votre chiffre d'affaires — même à zéro",
        body: "Vous déclarez ce que vous avez facturé chaque mois ou trimestre sur le portail auto-entrepreneur de l'URSSAF, et les cotisations en découlent. Déclarez même à 0 € — sauter des déclarations entraîne des pénalités puis la radiation.",
      },
    ],
    watchTitle: "Un point à prendre au sérieux",
    watchBody:
      "Être freelance suppose plusieurs clients et une vraie indépendance. Travailler des horaires fixes pour un seul café pendant des mois, sous sa direction, peut être requalifié en salariat déguisé — un problème surtout pour le café, mais bien réel. Des shifts variés dans différents cafés — c'est justement l'objet de cette plateforme — gardent la relation saine. Pour un poste permanent, demandez un contrat.",
    ratesTitle: "Combien paient les shifts ?",
    ratesBody:
      "Les cafés de spécialité parisiens affichent actuellement des shifts freelance entre 18 et 28 € de l'heure selon l'expérience et l'urgence. N'oubliez pas que les cotisations en sortent — 24 €/h facturés font environ 19 €/h après cotisations, avant impôt sur le revenu.",
    insuranceTitle: "Assurance",
    insuranceBody:
      "La responsabilité civile professionnelle (RC Pro) n'est pas obligatoire pour une activité de barista, mais elle coûte peu et certains cafés la demandent. Utile dès que vous travaillez régulièrement.",
    sourcesTitle: "Sources officielles",
    sources: [
      { label: "URSSAF — portail auto-entrepreneur", href: "https://www.autoentrepreneur.urssaf.fr" },
      { label: "Immatriculer son activité (guichet unique)", href: "https://formalites.entreprises.gouv.fr" },
      { label: "Service-Public — micro-entrepreneur", href: "https://www.service-public.fr/particuliers/vosdroits/F23961" },
    ],
    disclaimer:
      "Ce guide est une information générale, pas un conseil juridique ou fiscal. Les règles et les taux évoluent — vérifiez toujours auprès des sources officielles ci-dessus.",
    ctaTitle: "Prêt·e à servir ?",
    ctaBody: "Les shifts ouverts des cafés parisiens sont publics — salaire affiché.",
    ctaBrowse: "Voir les shifts ouverts",
    ctaJoin: "Créer un profil gratuit",
    sponsorLabel: "EMPLACEMENT SPONSOR PROPOSÉ — APERÇU, NON ACTIF",
    sponsorTitle: "En partenariat avec Shine",
    sponsorBody:
      "Shine est le compte pro français pensé pour les micro-entrepreneurs — aide à l'immatriculation, facturation et rappels URSSAF dans une seule app. Exemple de texte : « Ouvrez votre compte micro-entrepreneur avec Shine et facturez votre premier shift cette semaine. »",
    sponsorCta: "Exemple de CTA → shine.fr",
  },
} as const;

export function GuideFreelanceView({
  locale,
  sponsorPreview,
}: {
  locale: "en" | "fr";
  sponsorPreview: boolean;
}) {
  const t = COPY[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-[12px] font-medium tracking-[0.2em] text-muted-foreground">{t.eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {t.title}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t.intro}</p>
      <p className="mt-3 text-[13px] text-muted-foreground/80">{t.updated}</p>

      {sponsorPreview ? (
        <aside className="mt-8 rounded-lg border-2 border-dashed border-border-strong bg-muted/40 p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-danger">{t.sponsorLabel}</p>
          <p className="mt-2 font-display text-base font-semibold">{t.sponsorTitle}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.sponsorBody}</p>
          <p className="mt-2 text-[13px] font-medium text-muted-foreground">{t.sponsorCta}</p>
        </aside>
      ) : null}

      <ol className="mt-10 flex flex-col gap-8">
        {t.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong font-display text-sm font-semibold">
              {index + 1}
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">{step.title}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-lg border border-danger/25 bg-danger-soft p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t.watchTitle}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed">{t.watchBody}</p>
      </div>

      {[
        { title: t.ratesTitle, body: t.ratesBody },
        { title: t.insuranceTitle, body: t.insuranceBody },
      ].map((section) => (
        <div key={section.title} className="mt-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">{section.title}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{section.body}</p>
        </div>
      ))}

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">{t.sourcesTitle}</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {t.sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                rel="noopener noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-[15px] underline underline-offset-2 hover:text-muted-foreground"
              >
                {source.label} <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground/80">{t.disclaimer}</p>
      </div>

      <div className="mt-12 rounded-lg border border-border bg-surface p-6 text-center">
        <h2 className="font-display text-xl font-semibold tracking-tight">{t.ctaTitle}</h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">{t.ctaBody}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/hiring"
            className="pressable inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground"
          >
            {t.ctaBrowse} <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/signup"
            className="pressable inline-flex h-10 items-center rounded-md border border-border-strong px-5 text-sm font-medium hover:bg-muted"
          >
            {t.ctaJoin}
          </Link>
        </div>
      </div>
    </div>
  );
}
