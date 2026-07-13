import Link from "next/link";
import { SHOP_SUBSCRIPTION_PRICE_LABEL } from "@barista-gigs/shared";
import { PageShell } from "@/components/page-shell";
import { getCityBySlug, getSelectedCitySlug } from "@/lib/city";

export default async function HomePage() {
  const citySlug = await getSelectedCitySlug();
  const city = await getCityBySlug(citySlug);

  return (
    <PageShell
      title={`Barista gigs in ${city?.name ?? "your city"}`}
      description="Coffee shops post shift announcements. Freelance baristas browse gigs, express interest, and coordinate in-app."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">For coffee shops</p>
          <h2 className="mt-3 text-2xl font-semibold">Post unlimited gig announcements</h2>
          <p className="mt-3 text-stone-600">
            Set up your shop profile with address and machines. Subscribe for{" "}
            {SHOP_SUBSCRIPTION_PRICE_LABEL} and get recommended baristas when you post.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-white"
          >
            Register as a coffee shop
          </Link>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">For extras</p>
          <h2 className="mt-3 text-2xl font-semibold">Find gigs near you</h2>
          <p className="mt-3 text-stone-600">
            Build your profile with experience, rates, availability, and latte art shots. Browse open gigs and express interest.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-full border border-stone-900 px-5 py-2.5 text-stone-900"
          >
            Join as a barista
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
