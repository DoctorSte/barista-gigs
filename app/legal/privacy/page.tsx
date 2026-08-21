import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

// NOTE: template drafted to GDPR standards — have it reviewed by counsel and
// fill in the operator identity before public launch.

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="20 August 2026">
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
              <strong>Profile data you choose to share</strong> — for baristas: bio, skills, years
              of experience, rates, availability, portfolio photos, signature drink, Instagram
              handle, and a profile photo. For cafés: café name, address, description, machines,
              website, and phone number. This data is visible to other users in your city as part
              of how the marketplace works. Legal basis: performance of a contract.
            </span>,
            <span key="payment">
              <strong>Barista payment details</strong> — a free-text field (e.g. IBAN, payment
              link) you may fill in so cafés can pay you. It is stored separately from your public
              profile and disclosed only to cafés that have accepted you for a gig. We never use
              it ourselves. Legal basis: performance of a contract.
            </span>,
            <span key="activity">
              <strong>Activity data</strong> — gigs you post or apply to, applications and their
              outcomes, recommendations, messages between matched cafés and baristas, and in-app
              notifications. Legal basis: performance of a contract.
            </span>,
            <span key="billing">
              <strong>Café billing data</strong> — subscription status and billing identifiers.
              Card details are collected and processed by Stripe; we never see your full card
              number. Legal basis: performance of a contract and legal obligations (accounting).
            </span>,
            <span key="technical">
              <strong>Technical data</strong> — the session cookies needed to keep you logged in,
              and a temporary referral cookie if you arrive via a café&rsquo;s referral link.
              Legal basis: legitimate interest in operating a secure service.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="What we don't do">
        <LegalList
          items={[
            "We don't sell your personal data, and we don't share it with advertisers.",
            "We don't run third-party analytics, advertising trackers, or social media pixels.",
            "We don't make automated decisions with legal or similarly significant effects about you.",
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
              and profile images).
            </span>,
            <span key="stripe">
              <strong>Stripe</strong> — café subscription payments.
            </span>,
            <span key="osm">
              <strong>OpenStreetMap / Nominatim</strong> — we send café addresses (never personal
              names) to the Nominatim geocoding service to place cafés on a map, and map tiles are
              loaded from OpenStreetMap when you use the map view.
            </span>,
            <span key="hosting">
              <strong>Our hosting provider</strong> — serves the application and receives the
              technical request data (such as IP addresses) inherent in serving any website.
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
          session cookies, and a referral cookie (30 days) if you open a café&rsquo;s invite link,
          used solely to credit that café when you sign up. We do not use advertising or analytics
          cookies, which is why you don&rsquo;t see a cookie banner.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep data">
        <p>
          Your data is kept while your account exists. If you delete your account, your profile,
          applications, messages, notifications, and payment details are deleted with it. Billing
          records are kept as long as tax and accounting law requires. Backup copies expire on a
          rolling basis within a reasonable period.
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
