import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Terms of Service" };

// NOTE: template — have it reviewed by counsel and fill in the operator
// identity and governing law before public launch.

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="8 September 2026">
      <LegalSection heading="1. What Barista Gigs is">
        <p>
          Barista Gigs is a <strong>venue</strong>: a marketplace where cafés post one-off shifts (&ldquo;gigs&rdquo;) and freelance baristas
          (&ldquo;baristas&rdquo;) apply to work them. When a café accepts a barista, the two of
          them enter into a direct arrangement with each other.{" "}
          <strong>
            We are not a party to that arrangement, not an employer, not a staffing or employment
            agency, and not a payment intermediary.
          </strong>
        </p>
        <p>
          These terms are a contract between you and Barista Gigs [operator legal name — to be
          completed]. By creating an account you agree to them and to our{" "}
          <Link href="/legal/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts and team access">
        <LegalList
          items={[
            "You must be at least 18 years old and legally able to work (baristas) or hire (cafés) in your country.",
            "Keep your account information accurate. One account per person or café; a barista account and a café team account must be separate accounts.",
            "You are responsible for what happens under your account and for keeping your password safe.",
            <span key="team">
              A café owner can invite <strong>team members</strong> (the number of seats depends on
              the plan). Team members share the café&rsquo;s workspace — gigs, applicants, and
              messages — while billing, locations, and team management stay with the owner.{" "}
              <strong>
                The owner is responsible for their team members&rsquo; use of the workspace
              </strong>{" "}
              and can remove them at any time.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. The arrangement between cafés and baristas">
        <LegalList
          items={[
            <span key="direct">
              Shifts are agreed <strong>directly between the café and the barista</strong>,
              including pay, schedule, and working conditions. The gig listing is an invitation,
              not a contract; the contract forms between café and barista when they agree to work
              together.
            </span>,
            <span key="compliance">
              Both sides are responsible for complying with the laws that apply to them:
              work eligibility and visas, freelancer registration, minimum-wage and working-time
              rules, insurance, health and safety, and the taxes and social contributions on any
              payment. <strong>These obligations vary by country and are yours, not ours.</strong>
            </span>,
            <span key="payment">
              Payment happens directly between café and barista, outside the platform, using
              whatever method they agree (the barista&rsquo;s payment details field exists only to
              make that easier). We do not hold, transfer, or guarantee any payment.
            </span>,
            <span key="jobs">
              The same applies to full-time and part-time job listings: they are listings only,
              and any employment contract forms directly between the café and the barista, on
              terms they negotiate themselves.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="4. Subscriptions (cafés)">
        <p>
          Posting gigs requires a paid subscription (see current plans and prices on the billing
          page), billed monthly or yearly through Stripe. Plans differ in what they include —
          such as the number of gigs per month, café locations, and team seats — as described on
          the billing page at the time you subscribe.
          You can cancel any time and keep access until the end of the paid period. Prices may
          change with reasonable advance notice; changes never apply retroactively to a period
          you&rsquo;ve already paid for. Except where the law requires otherwise, fees already
          paid are non-refundable.
        </p>
      </LegalSection>

      <LegalSection heading="5. Referral programs">
        <LegalList
          items={[
            <span key="cafe">
              <strong>Café referrals:</strong> when a café that signed up through your referral
              link activates its first subscription, you receive a credit worth one month of your
              own plan, applied to your billing automatically.
            </span>,
            <span key="barista">
              <strong>Barista referrals:</strong> when a café that signed up through your referral
              link activates its first subscription, you earn the cash bonus stated next to your
              referral link at the time the café subscribes. We pay it out manually to the payment
              details on your profile; keeping those details accurate is your responsibility. The
              bonus is a marketing reward from us, not payment for work.
            </span>,
            "One reward per referred café, granted on its first subscription only. Self-referrals, fake accounts, and other abuse void the reward.",
            "We may change or end a referral program at any time; rewards already earned are honoured.",
            "Referral rewards may be taxable income where you live — declaring them is your responsibility.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. Rules of conduct">
        <LegalList
          items={[
            "Be honest: no fake profiles, gigs, recommendations, reviews, or credentials.",
            "Reviews must reflect a genuine experience from the shift being reviewed. No paid, traded, or retaliatory reviews.",
            "No discrimination in hiring or applying on grounds protected by applicable law.",
            "No harassment, spam, or abusive messages.",
            "Only upload content you have the right to share; no illegal content.",
            "Don't scrape the platform or misuse other users' data — contact details and payment details shared with you may be used only for the gig at hand.",
          ]}
        />
        <p>
          We may remove content, suspend, or close accounts that break these rules or the law,
          with notice where practicable.
        </p>
      </LegalSection>

      <LegalSection heading="7. Content, reviews, and track records">
        <p>
          You keep ownership of what you post and grant us the license needed to display it to
          other users as part of the service.
        </p>
        <LegalList
          items={[
            <span key="confirm">
              After a gig ends, the café records whether an accepted barista{" "}
              <strong>worked the shift or didn&rsquo;t show up</strong>. These confirmations come
              from the café, not from us, and feed the reliability statistics (confirmed shifts,
              show-up rate) shown on barista profiles.
            </span>,
            <span key="reviews">
              Once a shift is confirmed as worked, café and barista can each leave{" "}
              <strong>one review</strong> of the other. Reviews and ratings reflect their
              author&rsquo;s opinion, not ours. We don&rsquo;t edit reviews, but we may remove
              ones that break section 6 or the law.
            </span>,
            <span key="recs">
              Recommendations can only be given by cafés that actually accepted a barista for a
              gig; they reflect that café&rsquo;s opinion, not ours.
            </span>,
            <span key="passport">
              If you choose a username, your <strong>Barista Passport</strong> — a public page
              with your name, photos, and the cafés you&rsquo;ve worked at — becomes reachable by
              anyone with the link, beyond your city. You can take it offline by removing your
              username.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="8. Liability">
        <p>
          We provide the platform &ldquo;as is&rdquo; and work to keep it available and accurate,
          but we do not guarantee uninterrupted service, that gigs will be filled, or that any
          user is who they claim to be (see our{" "}
          <Link href="/legal/disclaimer" className="text-accent hover:underline">
            Disclaimers
          </Link>
          ). To the fullest extent permitted by applicable law, our liability is limited to the
          amount you paid us in the twelve months before the event giving rise to the claim.
          Nothing in these terms limits liability that cannot be limited by law, including for
          intent, gross negligence, or personal injury.
        </p>
      </LegalSection>

      <LegalSection heading="9. Ending your account">
        <p>
          You can delete your account at any time. We can terminate accounts as described in
          section 6, or discontinue the service with reasonable notice, in which case any prepaid
          subscription period after the shutdown date is refunded.
        </p>
      </LegalSection>

      <LegalSection heading="10. Governing law">
        <p>
          These terms are governed by the law of [jurisdiction — to be completed], without
          prejudice to mandatory consumer-protection rules of the country where you live. If you
          are a consumer in the EU, you may also use the European Commission&rsquo;s online
          dispute resolution platform.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
