import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

// NOTE: template drafted to GDPR standards — have it reviewed by counsel and
// fill in the operator identity before public launch.

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="8 September 2026">
      <LegalSection heading="Who we are">
        <p>
          Barista Gigs (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a marketplace that connects
          specialty cafés with freelance baristas for one-off shifts. This policy explains
          what personal data we collect, why, and the rights you have over it. It is written to
          meet the EU General Data Protection Regulation (GDPR), which is the strictest regime we
          operate under; where your local law grants you additional rights, those apply too.
        </p>
        <p>
          Data controller: <strong>Barista Gigs</strong> [operator legal name and address — to be
          completed]. Contact: <strong>privacy@baristagigs.dev</strong>.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <LegalList
          items={[
            <span key="account">
              <strong>Account data</strong> — email address, display name, account type (café or
              barista), and your chosen city. Legal basis: performance of a contract.
            </span>,
            <span key="profile">
              <strong>Profile data you choose to share</strong> — for baristas: bio, skills,
              languages, years of experience, rates, availability, portfolio photos, signature
              drink, Instagram handle, and a profile photo. For cafés: café name, address,
              description, machines, website, and phone number. This data is visible to other
              users in your city as part of how the marketplace works. Legal basis: performance of
              a contract.
            </span>,
            <span key="passport">
              <strong>Barista Passport</strong> — if you choose a username, a public page with
              your name, photos, and the cafés you&rsquo;ve worked at becomes reachable by anyone
              with the link. You control this by setting or removing your username. Legal basis:
              performance of a contract, at your initiative.
            </span>,
            <span key="cv">
              <strong>CV (optional, baristas)</strong> — stored in private storage and shared only
              with cafés reviewing your profile or applications, via short-lived links. Legal
              basis: performance of a contract.
            </span>,
            <span key="payment">
              <strong>Barista payment details</strong> — a free-text field (e.g. IBAN, payment
              link) you may fill in so cafés can pay you. It is stored separately from your public
              profile and disclosed only to cafés that have accepted you for a gig. We use it
              ourselves only to pay out referral bonuses you have earned. Legal basis: performance
              of a contract.
            </span>,
            <span key="activity">
              <strong>Activity data</strong> — gigs you post or apply to, applications and their
              outcomes, shift confirmations recorded by cafés (worked / no-show) and the
              reliability statistics derived from them, reviews and ratings, recommendations,
              saved baristas, messages between matched cafés and baristas, and in-app
              notifications. Legal basis: performance of a contract.
            </span>,
            <span key="team">
              <strong>Team accounts (cafés)</strong> — if a café owner invites you to their team,
              we store that membership, and you and the owner&rsquo;s other team members share
              access to the café&rsquo;s workspace data (gigs, applicants, messages). Legal basis:
              performance of a contract.
            </span>,
            <span key="referrals">
              <strong>Referral data</strong> — your referral code, which accounts signed up
              through your link, and any rewards earned (free months for cafés, cash bonuses for
              baristas). Legal basis: performance of a contract.
            </span>,
            <span key="billing">
              <strong>Café billing data</strong> — subscription status and billing identifiers.
              Card details are collected and processed by Stripe; we never see your full card
              number. Legal basis: performance of a contract and legal obligations (accounting).
            </span>,
            <span key="technical">
              <strong>Technical data</strong> — the session cookies needed to keep you logged in,
              a temporary referral cookie if you arrive via a referral link, and, for
              multi-location cafés, a cookie remembering which location you&rsquo;re working in.
              Legal basis: legitimate interest in operating a secure service.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="Emails and notifications">
        <p>
          We email you about account security (e.g. confirmation and password resets) and about
          activity that concerns you — new applicants, accepted applications, invites, urgent
          gigs, and a daily digest of unread activity. You can turn each category off in{" "}
          <strong>Settings → Notifications</strong>; account-security emails can&rsquo;t be
          disabled. We don&rsquo;t send marketing emails. Legal basis: performance of a contract
          and legitimate interest.
        </p>
      </LegalSection>

      <LegalSection heading="What we don't do">
        <LegalList
          items={[
            "We don't sell your personal data, and we don't share it with advertisers.",
            "We don't use advertising trackers or social media pixels. Our only analytics are cookieless, aggregated page statistics that can't identify you or follow you to other sites.",
            "We don't make automated decisions with legal or similarly significant effects about you. Reliability statistics summarise confirmations recorded by cafés; they inform other users, not automated decisions by us.",
            "We don't process wages or hold money between cafés and baristas.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Who processes data for us">
        <p>We use a small number of processors to run the service:</p>
        <LegalList
          items={[
            <span key="supabase">
              <strong>Supabase</strong> — database, authentication, and file storage (portfolio
              and profile images, CVs).
            </span>,
            <span key="stripe">
              <strong>Stripe</strong> — café subscription payments.
            </span>,
            <span key="resend">
              <strong>Resend</strong> — sends account and notification emails on our behalf.
            </span>,
            <span key="vercel">
              <strong>Vercel</strong> — hosts the application (receiving the technical request
              data, such as IP addresses, inherent in serving any website) and provides the
              cookieless, aggregated analytics mentioned above.
            </span>,
            <span key="osm">
              <strong>OpenStreetMap / Nominatim</strong> — we send café addresses (never personal
              names) to the Nominatim geocoding service to place cafés on a map, and map tiles are
              loaded from OpenStreetMap when you use the map view.
            </span>,
          ]}
        />
        <p>
          Where these providers process data outside the EU/EEA, transfers are covered by the
          providers&rsquo; Standard Contractual Clauses or an adequacy decision.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          We only use cookies that are necessary for the service to function: authentication
          session cookies, a referral cookie (30 days) if you open a café&rsquo;s or
          barista&rsquo;s referral link — used solely to credit them when you sign up — and a
          cookie remembering your active location if your café has several. Our analytics are
          cookieless. We do not use advertising cookies, which is why you don&rsquo;t see a
          cookie banner.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep data">
        <p>
          Your data is kept while your account exists. If you delete your account, your profile,
          applications, messages, notifications, and payment details are deleted with it. Billing
          records, and records of referral bonuses we have paid out, are kept as long as tax and
          accounting law requires. Backup copies expire on a rolling basis within a reasonable
          period.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Depending on where you live, you have the right to access, correct, export, restrict, or
          delete your personal data, to object to processing based on legitimate interest, and to
          withdraw consent at any time where processing is based on consent. You can edit most of
          your data directly in the app; for anything else, email{" "}
          <strong>privacy@baristagigs.dev</strong>. If you are in the EU/EEA you can also lodge a
          complaint with your local supervisory authority.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If we change this policy in a way that matters, we&rsquo;ll notify you in the app before
          the change takes effect. See also our <Link href="/legal/terms" className="text-accent hover:underline">Terms of Service</Link> and{" "}
          <Link href="/legal/disclaimer" className="text-accent hover:underline">Disclaimers</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
