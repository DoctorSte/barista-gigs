import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = { title: "Disclaimers" };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimers" updated="20 August 2026">
      <LegalSection heading="Not an employer or staffing agency">
        <p>
          Barista Gigs is a listing and matching service. We are not the employer of any barista,
          we are not a temporary-work or staffing agency, and we do not supervise, direct, or
          control anyone&rsquo;s work. Whether a given shift legally constitutes freelance work,
          casual employment, or something else depends on the law of the country where it happens
          and on how the café and barista arrange it — that classification, and its consequences
          (taxes, social security, insurance, permits), is the responsibility of the café and the
          barista, not of Barista Gigs.
        </p>
      </LegalSection>

      <LegalSection heading="No vetting">
        <p>
          We do not run background checks, verify certifications, confirm work eligibility, or
          audit cafés&rsquo; premises. Profiles, portfolios, recommendations, and gig descriptions
          are written by users. Exercise the same judgment you would with any stranger: meet
          first if you can, check references, and trust your instincts.
        </p>
      </LegalSection>

      <LegalSection heading="Payments">
        <p>
          All payment for shifts happens directly between café and barista. We do not hold funds,
          guarantee payment, mediate pay disputes, or verify the payment details baristas share.
          Only share payment information you are comfortable giving to a counterparty, and only
          after a gig is actually agreed.
        </p>
      </LegalSection>

      <LegalSection heading="Maps and geocoding">
        <p>
          Café locations are geocoded from user-entered addresses and displayed using{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            OpenStreetMap
          </a>{" "}
          data (© OpenStreetMap contributors). Positions can be imprecise or wrong — confirm the
          address with the café before travelling.
        </p>
      </LegalSection>

      <LegalSection heading="Availability and accuracy">
        <LegalList
          items={[
            "Gigs can be edited, filled, or withdrawn by cafés at any time; a listing is not a guarantee of work.",
            "Notifications are delivered best-effort and may be delayed; don't rely on them for time-critical decisions.",
            "We may change or discontinue features as the product evolves.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="No professional advice">
        <p>
          Nothing on this platform — including these pages — is legal, tax, or employment advice.
          For questions about your specific situation, consult a qualified professional in your
          country. See also our{" "}
          <Link href="/legal/terms" className="text-accent hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
