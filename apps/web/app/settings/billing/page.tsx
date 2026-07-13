import { SHOP_SUBSCRIPTION_PRICE_LABEL } from "@barista-gigs/shared";
import { PageShell } from "@/components/page-shell";
import { SubscribeButton } from "@/components/subscribe-button";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("coffee_shops")
    .select("id")
    .eq("owner_id", profile?.id ?? "")
    .maybeSingle();

  const { data: subscription } = shop
    ? await supabase
        .from("subscriptions")
        .select("*")
        .eq("shop_id", shop.id)
        .maybeSingle()
    : { data: null };

  return (
    <PageShell
      title="Billing"
      description={`Coffee shop plan: ${SHOP_SUBSCRIPTION_PRICE_LABEL} for unlimited announcements.`}
    >
      <div className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {params.success ? (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Subscription updated successfully.
          </p>
        ) : null}
        {params.canceled ? (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Checkout canceled.
          </p>
        ) : null}
        <p className="text-sm text-stone-600">Current status</p>
        <p className="mt-1 text-2xl font-semibold capitalize">
          {subscription?.status ?? "inactive"}
        </p>
        {subscription?.current_period_end ? (
          <p className="mt-2 text-sm text-stone-500">
            Renews {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        ) : null}
        <div className="mt-6">
          <SubscribeButton />
        </div>
      </div>
    </PageShell>
  );
}
