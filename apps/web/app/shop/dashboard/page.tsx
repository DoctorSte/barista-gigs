import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SubscribeButton } from "@/components/subscribe-button";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateRange, formatMoney } from "@/lib/utils";

export default async function ShopDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("coffee_shops")
    .select("id, name")
    .eq("owner_id", profile?.id ?? "")
    .maybeSingle();

  const { data: subscription } = shop
    ? await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("shop_id", shop.id)
        .maybeSingle()
    : { data: null };

  const { data: announcements } = shop
    ? await supabase
        .from("announcements")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <PageShell
      title="Shop dashboard"
      description="Manage announcements, subscription, and incoming interest."
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link href="/shop/profile" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
          Edit shop profile
        </Link>
        <Link
          href="/shop/announce/new"
          className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
        >
          Post new gig
        </Link>
        <Link href="/settings/billing" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
          Billing
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">Subscription</p>
        <p className="mt-1 text-lg font-medium capitalize">
          {subscription?.status ?? "inactive"}
        </p>
        {subscription?.status !== "active" ? <SubscribeButton /> : null}
      </div>

      <div className="grid gap-4">
        {!announcements?.length ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-stone-600">
            No announcements yet.
          </p>
        ) : (
          announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{announcement.title}</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-wide">
                  {announcement.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                {formatDateRange(announcement.starts_at, announcement.ends_at)} ·{" "}
                {formatMoney(announcement.pay_rate_cents)} {announcement.pay_type}
              </p>
              <p className="mt-3 text-stone-700">{announcement.description}</p>
            </article>
          ))
        )}
      </div>
    </PageShell>
  );
}
