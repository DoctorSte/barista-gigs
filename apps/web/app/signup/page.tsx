import { PageShell } from "@/components/page-shell";
import { SignupForm } from "@/components/signup-form";
import { getCities, getSelectedCitySlug } from "@/lib/city";

export default async function SignupPage() {
  const [cities, citySlug] = await Promise.all([
    getCities(),
    getSelectedCitySlug(),
  ]);

  return (
    <PageShell title="Create account" description="Choose whether you're a coffee shop or an extra.">
      <SignupForm cities={cities} defaultCitySlug={citySlug} />
    </PageShell>
  );
}
