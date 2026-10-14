import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Terms of Service" };

// NOTE: template — have it reviewed by French counsel (employment + platform
// law) and fill in the operator identity before public launch. The sections
// on independence, job listings and the staff planner are written to keep
// the platform a pure intermediary under the Code du travail: no price
// setting, no supervision, no sanctions, no labour supply.

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="14 October 2026">
      <LegalSection heading="1. What Barista Gigs is">
        <p>
          Barista Gigs is a <strong>venue</strong>: a marketplace where cafés post one-off shifts
          (&ldquo;gigs&rdquo;) and independent baristas (&ldquo;baristas&rdquo;) apply to work
          them, and where cafés can also advertise employed positions. When a café and a barista
          agree to work together, they enter into a direct arrangement with each other.{" "}
          <strong>
            We are not a party to that arrangement. We are not an employer, not a
            temporary-work agency (entreprise de travail temporaire), not a staffing or placement
            agency, and we do not supply, lend, or second labour.
          </strong>{" "}
          We do not select baristas for cafés, assign anyone to a shift, set or cap pay, supervise
          work, or take any commission on what a barista earns. Cafés pay a flat subscription to
          post; the platform is free for baristas and always will be — French law prohibits
          charging a person for finding them work, and we don&rsquo;t.
        </p>
        <p>
          These terms are a contract between you and Barista Gigs [operator legal name, legal
          form, registered office, RCS number — to be completed]. By creating an account you
          agree to them and to our{" "}
          <Link href="/legal/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          . They are written for use in France; if you use the platform elsewhere, the local
          rules on work and hiring apply to you in addition to what is said here.
        </p>
      </LegalSection>

      <LegalSection heading="2. Accounts and team access">
        <LegalList
          items={[
            "You must be at least 18 years old and legally able to work (baristas) or hire (cafés) in France.",
            "Keep your account information accurate. One account per person or café; a barista account and a café team account must be separate accounts.",
            "You are responsible for what happens under your account and for keeping your password safe.",
            <span key="team">
              A café owner can invite <strong>team members</strong> (the number of seats depends on
              the plan). Team members share the café&rsquo;s workspace — gigs, applicants, planner,
              and messages — while billing, locations, and team management stay with the owner.{" "}
              <strong>
                The owner is responsible for their team members&rsquo; use of the workspace
              </strong>{" "}
              and can remove them at any time.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="3. Gigs are freelance work">
        <p>
          A gig is a short, defined service (prestation de service) that an independent barista
          performs for a café as a professional, not as an employee. That is only lawful if the
          barista really is independent, so:
        </p>
        <LegalList
          items={[
            <span key="registered">
              <strong>Baristas must be registered before working a gig</strong> — as a
              micro-entrepreneur or through a company — and hold a valid SIRET number. Working a
              gig without being registered is undeclared work (travail dissimulé) for both sides.
              If you are not registered, you can still apply to the employed positions in section
              5, where the café hires you under an employment contract.
            </span>,
            <span key="invoice">
              The barista <strong>invoices the café</strong> for each gig and is responsible for
              declaring the income and paying their own social contributions and taxes. Payment is
              made directly between café and barista, by whatever method they agree; we do not
              hold, transfer, or guarantee any payment.
            </span>,
            <span key="insurance">
              Baristas arrange their own insurance. Professional liability cover (RC pro) is not
              compulsory for this activity but is strongly recommended, and some cafés will ask
              for it.
            </span>,
            <span key="rates">
              <strong>Pay is set between the café and the barista.</strong> The rate on a listing
              is the café&rsquo;s proposal; a barista is free to accept it, negotiate it, or pass.
              We do not fix, suggest, or cap rates, and we have no say in the terms of any gig.
            </span>,
            <span key="safety">
              The café remains responsible for the safety of its premises and equipment for
              everyone working there, including independent baristas.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="4. Keeping baristas independent">
        <p>
          Under French law, what matters is not what an arrangement is called but how it works in
          practice. A freelance barista who works fixed hours for the same café week after week,
          takes instructions on how to work, and can be penalised for not complying, is an
          employee in disguise (salariat déguisé) — and a court can reclassify the relationship as
          an employment contract, with back-contributions and penalties falling mostly on the
          café. The platform is built to stay clear of that, and we ask you to use it the same
          way.
        </p>
        <LegalList
          items={[
            <span key="free">
              <strong>Baristas are never obliged to accept a gig</strong>, to be available at any
              time, or to work a minimum number of gigs. Declining or ignoring a gig — including an
              SOS gig — has no consequence on the platform.
            </span>,
            <span key="exclusive">
              <strong>No exclusivity.</strong> Baristas may work for anyone, through any channel,
              including directly with cafés they first met here, and cafés may hire baristas
              however they like. We charge nothing for working together off-platform and never
              will.
            </span>,
            <span key="control">
              <strong>We do not supervise anyone.</strong> We give no instructions on how a shift
              is to be done, we do not monitor working time or location, and we do not sanction
              baristas or cafés based on ratings, reliability records, or how often they use the
              platform. We only act on accounts for the conduct reasons in section 8.
            </span>,
            <span key="cafes">
              <strong>Cafés: use gigs for what they are.</strong> Cover, events, rushes, and other
              one-off or irregular needs. If you need someone on a fixed schedule every week, or
              someone who is part of your team under your direction, that is a job: post an
              employed position (section 5) or add them to your own staff (section 6) and hire
              them under an employment contract.
            </span>,
            <span key="vigilance">
              <strong>Cafés: check who you are contracting with.</strong> Ask for the
              barista&rsquo;s SIRET before the first gig. If your contracts with the same barista
              reach €5,000 excluding VAT in total, French law requires you to obtain their URSSAF
              attestation de vigilance and renew it every six months, or you can be held liable
              for their unpaid contributions.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. Employed positions (full-time and part-time listings)">
        <p>
          Cafés can also advertise employed positions. These are job advertisements, nothing
          more: <strong>the café is the employer</strong>, the employment contract forms directly
          between the café and the person hired, on terms they agree themselves, and the café is
          solely responsible for every obligation that comes with hiring — the written contract,
          the pre-hire declaration (DPAE), payslips, minimum wage, working time, and everything
          else in the Code du travail and the applicable collective agreement (convention
          collective HCR for most cafés).
        </p>
        <LegalList
          items={[
            "Job advertisements for positions in France must be written in French. You may add an English version alongside.",
            "Advertisements must be accurate and dated, and must not mislead about the role, the pay, or the conditions.",
            "No discriminatory requirements: age, sex, origin, family situation, appearance, religion, health, or any other ground protected by law may not appear in a listing or be used in selection.",
            "Baristas and job seekers never pay anything to apply, to be put in contact, or to be hired. Any attempt to charge them is prohibited.",
            "We publish these listings on a public hiring page so that search engines and job aggregators can index them. Closing or deleting a listing removes it from that page at the next refresh.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. The staff planner">
        <p>
          The planner lets a café schedule its <strong>own employees</strong> alongside its gigs.
          It is a scheduling tool, not an HR or payroll system, and using it changes nothing about
          who employs whom: the people on your staff list are your employees, not ours.
        </p>
        <LegalList
          items={[
            "The café remains solely responsible for complying with working-time rules — daily and weekly maximums, rest periods, breaks, overtime, Sunday and night work, and the rules of its collective agreement. The planner does not enforce these and does not warn you when a schedule breaches them.",
            "The planner is not the legal record of hours worked. Keep whatever time records the law and your collective agreement require, independently of what is in the planner.",
            "Contracted weekly hours stored in the planner are a planning aid. They do not create, modify, or evidence an employment contract.",
            "A staff member can link their own account to their planner entry only by accepting an invitation. Once linked they can see their rota and mark days off; how those marks are handled — approved, refused, counted as leave — is between the café and its employee, under their contract and the law.",
            "Removing a staff member from the planner is not a dismissal and has no employment-law effect; it only removes them from the schedule.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="7. Subscriptions (cafés)">
        <p>
          Posting gigs and job listings requires a paid subscription (see current plans and
          prices on the billing page), billed monthly or yearly through Stripe. Plans differ in
          what they include — such as the number of gigs per month, café locations, and team seats
          — as described on the billing page at the time you subscribe. The fee is the same
          whether or not any gig gets filled, and never depends on how many baristas you work
          with or what you pay them. You can cancel any time and keep access until the end of the
          paid period. Prices may change with reasonable advance notice; changes never apply
          retroactively to a period you&rsquo;ve already paid for. Except where the law requires
          otherwise, fees already paid are non-refundable.
        </p>
      </LegalSection>

      <LegalSection heading="8. Referral programs">
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
              bonus is a marketing reward from us for introducing a customer — it is not payment
              for work, and it creates no working relationship between you and us.
            </span>,
            "One reward per referred café, granted on its first subscription only. Self-referrals, fake accounts, and other abuse void the reward.",
            "We may change or end a referral program at any time; rewards already earned are honoured.",
            "Referral rewards are income: declaring them, and invoicing us for them if your status requires it, is your responsibility.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="9. Rules of conduct">
        <LegalList
          items={[
            "Be honest: no fake profiles, gigs, recommendations, reviews, or credentials.",
            "Reviews must reflect a genuine experience from the shift being reviewed. No paid, traded, or retaliatory reviews.",
            "No discrimination in hiring or applying on grounds protected by law.",
            "No harassment, spam, or abusive messages.",
            "Don't use the platform to arrange undeclared work: no gigs for unregistered baristas, no cash-in-hand arrangements to avoid contributions.",
            "Only upload content you have the right to share; no illegal content.",
            "Don't scrape the platform or misuse other users' data — contact details and payment details shared with you may be used only for the gig at hand.",
          ]}
        />
        <p>
          We may remove content, suspend, or close accounts that break these rules or the law,
          with notice where practicable. We never suspend or restrict an account because of
          ratings, reliability statistics, or declined gigs.
        </p>
      </LegalSection>

      <LegalSection heading="10. Content, reviews, and track records">
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
              show-up rate) shown on barista profiles. They are a factual record kept by the café,
              not a sanction, and we attach no consequence to them. If a record is wrong, contact
              us and we will ask the café to correct it.
            </span>,
            <span key="reviews">
              Once a shift is confirmed as worked, café and barista can each leave{" "}
              <strong>one review</strong> of the other. Only the two parties to a confirmed shift
              can review it, which is the only verification we perform. Reviews are shown in
              date order, newest first, with their date. They reflect their author&rsquo;s
              opinion, not ours. We don&rsquo;t edit reviews, but we may remove ones that break
              section 9 or the law.
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

      <LegalSection heading="11. Liability">
        <p>
          We provide the platform &ldquo;as is&rdquo; and work to keep it available and accurate,
          but we do not guarantee uninterrupted service, that gigs will be filled, or that any
          user is who they claim to be (see our{" "}
          <Link href="/legal/disclaimer" className="text-accent hover:underline">
            Disclaimers
          </Link>
          ). We do not verify anyone&rsquo;s registration, insurance, right to work, or
          compliance with the obligations described in sections 3 to 6; those obligations are
          yours. To the fullest extent permitted by applicable law, our liability is limited to
          the amount you paid us in the twelve months before the event giving rise to the claim.
          Nothing in these terms limits liability that cannot be limited by law, including for
          intent, gross negligence, or personal injury.
        </p>
      </LegalSection>

      <LegalSection heading="12. Ending your account">
        <p>
          You can delete your account at any time. We can terminate accounts as described in
          section 9, or discontinue the service with reasonable notice, in which case any prepaid
          subscription period after the shutdown date is refunded.
        </p>
      </LegalSection>

      <LegalSection heading="13. Governing law">
        <p>
          These terms are governed by French law. Cafés and baristas use the platform as
          professionals; any dispute that cannot be settled amicably goes to the competent courts
          of Paris. If, exceptionally, you use the platform as a consumer, the mandatory
          consumer-protection rules of the country where you live still apply, and you may use the
          European Commission&rsquo;s online dispute resolution platform.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
