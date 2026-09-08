// Copy for the marketing pages in both locales. The shape is identical for
// every locale so the view components can render either. Icons live with the
// views; text lives here.

export type Locale = "en" | "fr";

type Step = { number: string; title: string; body: string };
type FeatureCopy = { title: string; body: string };
export type FaqCopy = { question: string; answer: string };

export type LandingCopy = {
  badge: string;
  heroLine1: string;
  heroLine2: string;
  heroSub: string;
  ctaFindGigs: string;
  ctaStaffBar: string;
  freeLine: string;
  steps: Step[];
  cafesEyebrow: string;
  cafesHeading: string;
  cafeFeatures: FeatureCopy[];
  cafesLink: string;
  baristasEyebrow: string;
  baristasHeading: string;
  baristaFeatures: FeatureCopy[];
  baristasLink: string;
  passport: PassportCopy;
  pricingHeading: string;
  pricingSub: string;
  ctaStartHiring: string;
};

export type PassportCopy = {
  label: string;
  heading: string;
  body: string;
  cta: string;
};

export type AudiencePageCopy = {
  eyebrow: string;
  heroTitle1: string;
  heroTitle2?: string;
  heroSub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaSecondaryHref: string;
  heroNote: string;
  featuresHeading: string;
  features: FeatureCopy[];
  faqHeading: string;
  faqs: FaqCopy[];
  finalCta: { title: string; body: string; ctaLabel: string };
};

export type ForCafesCopy = AudiencePageCopy & {
  messagingTitle: string;
  messagingBody: string;
  pricingHeading: string;
  pricingSub: string;
  ctaStartHiring: string;
};

export type PlanCardsCopy = {
  perMonth: string;
  yearly: (yearlyEuros: number) => string;
  mostPopular: string;
  unlimitedGigs: string;
  gigsPerMonth: (n: number) => string;
  oneLocation: string;
  locations: (n: number) => string;
  singleAccount: string;
  teamAccounts: (n: number) => string;
  directory: string;
  referrals: string;
};

export const PLAN_CARDS_COPY: Record<Locale, PlanCardsCopy> = {
  en: {
    perMonth: "/month",
    yearly: (y) => `or €${y}/year — 2 months free`,
    mostPopular: "Most popular",
    unlimitedGigs: "Unlimited gigs",
    gigsPerMonth: (n) => `${n} gigs a month`,
    oneLocation: "1 location",
    locations: (n) => `Up to ${n} locations`,
    singleAccount: "Single account",
    teamAccounts: (n) => `${n} team accounts`,
    directory: "Barista directory",
    referrals: "Referral free months",
  },
  fr: {
    perMonth: "/mois",
    yearly: (y) => `ou ${y} €/an — 2 mois offerts`,
    mostPopular: "Le plus choisi",
    unlimitedGigs: "Gigs illimités",
    gigsPerMonth: (n) => `${n} gigs par mois`,
    oneLocation: "1 établissement",
    locations: (n) => `Jusqu'à ${n} établissements`,
    singleAccount: "Compte unique",
    teamAccounts: (n) => `${n} comptes d'équipe`,
    directory: "Annuaire des baristas",
    referrals: "Mois offerts par parrainage",
  },
};

export const LANDING_COPY: Record<Locale, LandingCopy> = {
  en: {
    badge: "Now pouring in Paris — any city welcome",
    heroLine1: "Great coffee needs",
    heroLine2: "great hands.",
    heroSub:
      "Barista Gigs connects specialty cafés with skilled freelance baristas for one-off shifts. Post a gig, find your extra, pour on.",
    ctaFindGigs: "Find gigs",
    ctaStaffBar: "Staff your bar",
    freeLine: "100% free for baristas — no fees, no commission on your pay.",
    steps: [
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
    ],
    cafesEyebrow: "For cafés",
    cafesHeading: "Cover the bar, keep the standard",
    cafeFeatures: [
      {
        title: "SOS mode",
        body: "Barista called in sick an hour before open? Flag the gig urgent and every barista in your city hears about it.",
      },
      {
        title: "Track records you can trust",
        body: "Confirmed shifts, show-up rates, and reviews from other cafés — on every applicant.",
      },
      {
        title: "Team accounts & locations",
        body: "Give your managers the workspace, keep billing to yourself. Up to three locations on one plan.",
      },
    ],
    cafesLink: "Everything for cafés",
    baristasEyebrow: "For baristas",
    baristasHeading: "Your craft, on your terms",
    baristaFeatures: [
      {
        title: "The Barista Passport",
        body: "Every confirmed shift stamps your shareable passport — your career, documented café by café.",
      },
      {
        title: "Gigs on a map",
        body: "See every open shift in your city, filter by skill and rate, apply in one tap.",
      },
      {
        title: "€50 per café you bring",
        body: "Refer a café; when they subscribe, you get a cash bonus. And the platform stays free for you, always.",
      },
    ],
    baristasLink: "Everything for baristas",
    passport: {
      label: "Free for baristas · forever",
      heading: "Every shift earns a stamp.",
      body: "Work a gig, and the café goes into your Barista Passport — a shareable page of stamps, latte art, and the bars you've run. Your career, documented.",
      cta: "Start your passport",
    },
    pricingHeading: "Simple pricing for cafés",
    pricingSub: "Free for baristas, always. Cafés pick the plan that fits their bar.",
    ctaStartHiring: "Start hiring",
  },
  fr: {
    badge: "Déjà en service à Paris — toutes les villes sont bienvenues",
    heroLine1: "Un bon café demande",
    heroLine2: "de bonnes mains.",
    heroSub:
      "Barista Gigs met en relation les cafés de spécialité et les baristas freelances pour des shifts ponctuels. Publiez un gig, trouvez votre renfort, continuez à servir.",
    ctaFindGigs: "Trouver des gigs",
    ctaStaffBar: "Renforcer votre équipe",
    freeLine: "100 % gratuit pour les baristas — sans frais, sans commission sur votre paie.",
    steps: [
      {
        number: "01",
        title: "Publiez le shift",
        body: "Les cafés publient leurs gigs avec dates, rémunération et compétences attendues — du calage des moutures au latte art.",
      },
      {
        number: "02",
        title: "Les baristas lèvent la main",
        body: "Les baristas freelances de votre ville parcourent les gigs ouverts et se proposent en un geste.",
      },
      {
        number: "03",
        title: "Matchez et discutez",
        body: "Acceptez le bon profil et réglez les détails par message. Sans agence, sans tableurs.",
      },
    ],
    cafesEyebrow: "Pour les cafés",
    cafesHeading: "Un bar couvert, un niveau maintenu",
    cafeFeatures: [
      {
        title: "Mode SOS",
        body: "Un barista malade une heure avant l'ouverture ? Marquez le gig urgent et tous les baristas de votre ville sont alertés.",
      },
      {
        title: "Des parcours vérifiables",
        body: "Shifts confirmés, taux de présence et avis d'autres cafés — sur chaque candidature.",
      },
      {
        title: "Comptes d'équipe & établissements",
        body: "Donnez l'espace de travail à vos managers, gardez la facturation pour vous. Jusqu'à trois établissements sur un seul abonnement.",
      },
    ],
    cafesLink: "Tout pour les cafés",
    baristasEyebrow: "Pour les baristas",
    baristasHeading: "Votre métier, à vos conditions",
    baristaFeatures: [
      {
        title: "Le Passeport Barista",
        body: "Chaque shift confirmé tamponne votre passeport partageable — votre carrière, documentée café par café.",
      },
      {
        title: "Les gigs sur une carte",
        body: "Visualisez tous les shifts ouverts de votre ville, filtrez par compétence et tarif, candidatez en un geste.",
      },
      {
        title: "50 € par café parrainé",
        body: "Parrainez un café ; quand il s'abonne, vous touchez une prime. Et la plateforme reste gratuite pour vous, toujours.",
      },
    ],
    baristasLink: "Tout pour les baristas",
    passport: {
      label: "Gratuit pour les baristas · pour toujours",
      heading: "Chaque shift vaut un tampon.",
      body: "Travaillez un gig, et le café rejoint votre Passeport Barista — une page partageable de tampons, de latte art et de comptoirs que vous avez tenus. Votre carrière, documentée.",
      cta: "Créer mon passeport",
    },
    pricingHeading: "Un prix simple pour les cafés",
    pricingSub: "Gratuit pour les baristas, toujours. Les cafés choisissent la formule qui va à leur bar.",
    ctaStartHiring: "Commencer à recruter",
  },
};

export const FOR_CAFES_COPY: Record<Locale, ForCafesCopy> = {
  en: {
    eyebrow: "For cafés",
    heroTitle1: "Staff your bar without the agency.",
    heroSub:
      "Post a shift, hear from experienced freelance baristas in your city, and pick the right hands — with real track records to go on. From sick-day SOS to fashion-week pop-ups.",
    ctaPrimary: "Start hiring",
    ctaSecondary: "See pricing",
    ctaSecondaryHref: "#pricing",
    heroNote: "From €15/month · unlimited applicants · cancel anytime",
    featuresHeading: "Everything between “we're short” and “we're covered”",
    features: [
      {
        title: "Post a gig in minutes",
        body: "Single shifts or multi-date runs, hourly or flat pay, and the exact skills your bar needs — from dialing in to latte art.",
      },
      {
        title: "SOS mode for emergencies",
        body: "Someone called in sick before the morning rush? Mark the gig SOS and every available barista in your city gets alerted.",
      },
      {
        title: "Track records, not promises",
        body: "Every applicant shows confirmed shifts, show-up rate, and star reviews from other cafés. After each shift, you confirm who worked and review them back.",
      },
      {
        title: "A directory you can work",
        body: "Browse every available barista in your city. Filter by skill and rate, save your favourites, invite them straight to a gig, and rebook the ones you loved.",
      },
      {
        title: "Team accounts & locations",
        body: "Invite your managers to share the workspace — gigs, applicants, messages — while billing stays with you. The Group plan covers up to three locations.",
      },
      {
        title: "Referrals pay your bill",
        body: "Share your referral link with café friends. Every café that subscribes through it earns you a free month, automatically.",
      },
    ],
    messagingTitle: "Sort the details in chat, keep everything in one place",
    messagingBody:
      "Accepting an applicant opens a message thread — agree timing, dress code, and pay without switching to phone numbers and lost texts. Your whole team sees the same inbox.",
    pricingHeading: "One flat price. No commissions.",
    pricingSub: "Baristas keep every euro they earn — you pay a subscription, nothing per hire.",
    ctaStartHiring: "Start hiring",
    faqHeading: "Questions, answered",
    faqs: [
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
    ],
    finalCta: {
      title: "Your next shift is one post away",
      body: "Create your café's profile, post your first gig, and meet the baristas keeping your city caffeinated.",
      ctaLabel: "Create a café account",
    },
  },
  fr: {
    eyebrow: "Pour les cafés",
    heroTitle1: "Renforcez votre équipe, sans agence.",
    heroSub:
      "Publiez un shift, recevez les candidatures de baristas freelances expérimentés de votre ville et choisissez les bonnes mains — sur la base de vrais parcours. Du SOS jour de maladie au pop-up de la fashion week.",
    ctaPrimary: "Commencer à recruter",
    ctaSecondary: "Voir les tarifs",
    ctaSecondaryHref: "#pricing",
    heroNote: "Dès 15 €/mois · candidatures illimitées · résiliable à tout moment",
    featuresHeading: "Tout ce qu'il y a entre « on est à court » et « c'est couvert »",
    features: [
      {
        title: "Publiez un gig en quelques minutes",
        body: "Shift unique ou séries de dates, paie horaire ou forfaitaire, et les compétences exactes qu'il faut à votre bar — du calage des moutures au latte art.",
      },
      {
        title: "Le mode SOS pour les urgences",
        body: "Un arrêt maladie juste avant le rush du matin ? Marquez le gig SOS et tous les baristas disponibles de votre ville sont alertés.",
      },
      {
        title: "Des parcours, pas des promesses",
        body: "Chaque candidat affiche ses shifts confirmés, son taux de présence et ses avis d'autres cafés. Après chaque shift, vous confirmez qui a travaillé et laissez votre avis.",
      },
      {
        title: "Un annuaire qui travaille pour vous",
        body: "Parcourez tous les baristas disponibles de votre ville. Filtrez par compétence et tarif, enregistrez vos favoris, invitez-les directement sur un gig et réservez à nouveau ceux que vous avez adorés.",
      },
      {
        title: "Comptes d'équipe & établissements",
        body: "Invitez vos managers à partager l'espace de travail — gigs, candidatures, messages — pendant que la facturation reste chez vous. La formule Group couvre jusqu'à trois établissements.",
      },
      {
        title: "Le parrainage paie votre abonnement",
        body: "Partagez votre lien de parrainage avec vos amis cafetiers. Chaque café qui s'abonne via votre lien vous offre un mois gratuit, automatiquement.",
      },
    ],
    messagingTitle: "Réglez les détails par message, gardez tout au même endroit",
    messagingBody:
      "Accepter une candidature ouvre une conversation — accordez-vous sur les horaires, la tenue et la paie sans passer par les numéros de téléphone et les SMS perdus. Toute votre équipe voit la même boîte de réception.",
    pricingHeading: "Un prix fixe. Zéro commission.",
    pricingSub:
      "Les baristas gardent chaque euro gagné — vous payez un abonnement, rien par recrutement.",
    ctaStartHiring: "Commencer à recruter",
    faqHeading: "Vos questions, nos réponses",
    faqs: [
      {
        question: "Employez-vous les baristas ?",
        answer:
          "Non. Barista Gigs est une place de marché : le café et le barista s'accordent directement sur le shift, la paie et les conditions. Nous ne sommes pas une agence d'intérim et nous ne prenons jamais de commission sur la paie du barista.",
      },
      {
        question: "Combien ça coûte ?",
        answer:
          "Les formules démarrent à 15 €/mois (ou 149 €/an) pour 3 gigs par mois. La formule Regular à 25 €/mois offre des gigs illimités, et Group à 49 €/mois ajoute jusqu'à trois établissements et dix comptes d'équipe. Résiliable à tout moment.",
      },
      {
        question: "Comment savoir si un barista est bon ?",
        answer:
          "Chaque profil montre ses compétences, son expérience, ses tarifs, son portfolio et un parcours construit sur la plateforme : shifts confirmés par les cafés, taux de présence, avis et recommandations des cafés où il a travaillé.",
      },
      {
        question: "Comment se passe le paiement ?",
        answer:
          "Vous payez le barista directement, comme vous en convenez ensemble — les baristas acceptés partagent leurs coordonnées de paiement avec vous. Votre abonnement est la seule chose que Barista Gigs facture.",
      },
      {
        question: "Dans quelles villes ça fonctionne ?",
        answer:
          "Nous démarrons à Paris, mais toutes les villes sont bienvenues — définissez la ville de votre café et les baristas qui s'y inscrivent verront vos gigs.",
      },
      {
        question: "Puis-je aussi recruter en CDI ou CDD ?",
        answer:
          "Oui — en plus des gigs ponctuels, vous pouvez publier des offres à temps plein et à temps partiel, avec CV joints aux candidatures.",
      },
    ],
    finalCta: {
      title: "Votre prochain shift est à une annonce près",
      body: "Créez le profil de votre café, publiez votre premier gig et rencontrez les baristas qui font tourner votre ville.",
      ctaLabel: "Créer un compte café",
    },
  },
};

export const FOR_BARISTAS_COPY: Record<Locale, AudiencePageCopy & { passport: PassportCopy }> = {
  en: {
    eyebrow: "For baristas",
    heroTitle1: "Pour where you're needed.",
    heroTitle2: "Keep every euro.",
    heroSub:
      "Paid shifts at specialty cafés in your city — sick-day covers, event bars, brunch rushes. Free forever, with no commission on your pay and a passport that proves your craft.",
    ctaPrimary: "Create your free profile",
    ctaSecondary: "Browse gigs",
    ctaSecondaryHref: "/gigs",
    heroNote: "Live in Paris — any city welcome",
    featuresHeading: "Built for working baristas",
    features: [
      {
        title: "One profile, all your rates",
        body: "Bio, skills, portfolio, languages, CV, and separate rates for regular shifts, events, or training — cafés see exactly what you offer.",
      },
      {
        title: "Apply in one tap",
        body: "Your profile is your pitch. See a gig you like — on the list or the map — and raise your hand. A message is optional.",
      },
      {
        title: "A track record that travels",
        body: "Cafés confirm your shifts and review your work. Confirmed shifts, show-up rate, and stars follow you to every application.",
      },
      {
        title: "Your pay stays yours",
        body: "Cafés pay you directly, however you agree — cash, transfer, invoice. We never touch it and never take a percentage.",
      },
      {
        title: "Gigs today, jobs tomorrow",
        body: "Alongside one-off shifts, cafés post full-time and part-time roles. Attach your CV and apply from the same profile.",
      },
      {
        title: "€50 for every café you bring",
        body: "Know a café that should be hiring here? Share your link — when they subscribe, you get a €50 cash bonus.",
      },
    ],
    passport: {
      label: "Your career, documented",
      heading: "Every shift earns a stamp.",
      body: "Each confirmed shift stamps your Barista Passport with the café's mark. Add your latte art, pick a username, and share one link that shows everywhere you've poured.",
      cta: "Start your passport",
    },
    faqHeading: "Questions, answered",
    faqs: [
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
    ],
    finalCta: {
      title: "The bar is waiting",
      body: "Set up your profile in five minutes and start hearing from cafés in your city. Free, forever.",
      ctaLabel: "Create your free profile",
    },
  },
  fr: {
    eyebrow: "Pour les baristas",
    heroTitle1: "Servez là où on a besoin de vous.",
    heroTitle2: "Gardez chaque euro.",
    heroSub:
      "Des shifts payés dans les cafés de spécialité de votre ville — remplacements, bars d'événements, rushs du brunch. Gratuit pour toujours, sans commission sur votre paie, avec un passeport qui prouve votre savoir-faire.",
    ctaPrimary: "Créer mon profil gratuit",
    ctaSecondary: "Voir les gigs",
    ctaSecondaryHref: "/gigs",
    heroNote: "En service à Paris — toutes les villes sont bienvenues",
    featuresHeading: "Pensé pour les baristas qui bossent",
    features: [
      {
        title: "Un profil, tous vos tarifs",
        body: "Bio, compétences, portfolio, langues, CV, et des tarifs distincts pour les shifts classiques, les événements ou les formations — les cafés voient exactement ce que vous proposez.",
      },
      {
        title: "Candidatez en un geste",
        body: "Votre profil parle pour vous. Un gig vous plaît — sur la liste ou la carte — levez la main. Le message est optionnel.",
      },
      {
        title: "Un parcours qui vous suit",
        body: "Les cafés confirment vos shifts et évaluent votre travail. Shifts confirmés, taux de présence et étoiles vous accompagnent à chaque candidature.",
      },
      {
        title: "Votre paie reste la vôtre",
        body: "Les cafés vous paient directement, comme vous en convenez — espèces, virement, facture. Nous n'y touchons jamais et ne prenons aucun pourcentage.",
      },
      {
        title: "Des gigs aujourd'hui, un emploi demain",
        body: "En plus des shifts ponctuels, les cafés publient des postes à temps plein et partiel. Joignez votre CV et candidatez depuis le même profil.",
      },
      {
        title: "50 € par café que vous amenez",
        body: "Vous connaissez un café qui devrait recruter ici ? Partagez votre lien — quand il s'abonne, vous touchez une prime de 50 €.",
      },
    ],
    passport: {
      label: "Votre carrière, documentée",
      heading: "Chaque shift vaut un tampon.",
      body: "Chaque shift confirmé tamponne votre Passeport Barista de la marque du café. Ajoutez votre latte art, choisissez un pseudo et partagez un seul lien qui montre partout où vous avez servi.",
      cta: "Créer mon passeport",
    },
    faqHeading: "Vos questions, nos réponses",
    faqs: [
      {
        question: "Est-ce que ça coûte quelque chose ?",
        answer:
          "Non. Barista Gigs est gratuit pour les baristas, pour toujours — pas d'abonnement, pas de commission, pas de frais sur votre paie. Ce sont les cafés qui paient un abonnement pour publier des gigs.",
      },
      {
        question: "Comment suis-je payé·e ?",
        answer:
          "Directement par le café, selon la méthode que vous choisissez ensemble. Votre profil comporte un champ privé de coordonnées de paiement, visible uniquement des cafés qui vous ont accepté·e sur un gig.",
      },
      {
        question: "C'est quoi, le Passeport Barista ?",
        answer:
          "Une page publique et partageable de votre carrière : les tampons des cafés où vous avez travaillé, votre latte art, votre histoire. Choisissez un pseudo et elle est en ligne à votre propre lien.",
      },
      {
        question: "Faut-il des années d'expérience ?",
        answer:
          "Aucun minimum. Votre profil montre vos vraies compétences et vos tarifs, et votre parcours se construit à chaque shift confirmé — les cafés décident de ce qui convient à leur bar.",
      },
      {
        question: "Et côté statut et impôts ?",
        answer:
          "Vous travaillez directement avec les cafés : s'enregistrer comme indépendant (micro-entreprise, par exemple) et déclarer ses revenus fonctionne comme pour toute activité freelance dans votre pays. Cette partie se joue entre vous et le café.",
      },
      {
        question: "Dans quelles villes ça fonctionne ?",
        answer:
          "Nous démarrons à Paris, mais toutes les villes sont bienvenues — définissez votre ville et vous verrez tous les gigs qui y sont publiés.",
      },
    ],
    finalCta: {
      title: "Le comptoir vous attend",
      body: "Créez votre profil en cinq minutes et commencez à recevoir des propositions des cafés de votre ville. Gratuit, pour toujours.",
      ctaLabel: "Créer mon profil gratuit",
    },
  },
};
