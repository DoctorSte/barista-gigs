import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getOwnerShops, getOwnerSubscription, requireShop } from "@/lib/auth";
import { getFeaturedCities } from "@/lib/city";
import { PLANS, isPlanId } from "@/lib/plans";
import { AddLocationForm } from "@/components/add-location-form";
import { Card } from "@/components/ui/card";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Add location" };

export default async function NewLocationPage() {
  await requireShop();
  const [shops, subscription, featuredCities] = await Promise.all([
    getOwnerShops(),
    getOwnerSubscription(),
    getFeaturedCities(),
  ]);
  const plan = PLANS[isPlanId(subscription?.plan) ? subscription!.plan : "regular"];
  const atLimit = shops.length >= plan.locations;

  const d = await getDict();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/cafe/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {d.cafe.dashboardBack}
      </Link>
      <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight">{d.shopForm.addLocationTitle}</h1>
      <p className="mb-8 text-[15px] text-muted-foreground">
        {d.shopForm.addLocationSub}
      </p>
      <Card>
        {atLimit ? (
          <p className="text-sm text-muted-foreground">
            Your {plan.name} plan includes{" "}
            {plan.locations === 1 ? "1 location" : `up to ${plan.locations} locations`} and
            they&apos;re all in use.{" "}
            <Link href="/settings/billing" className="text-accent hover:underline">
              Upgrade to Group
            </Link>{" "}
            for up to 3.
          </p>
        ) : (
          <AddLocationForm featuredCities={featuredCities} />
        )}
      </Card>
    </div>
  );
}
