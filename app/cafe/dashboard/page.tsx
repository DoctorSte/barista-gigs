import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, CalendarClock, ClipboardList, Plus, Sparkles, Users } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { formatGigSchedule, formatPay } from "@/lib/format";
import { Badge, GigStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReferralLink } from "@/components/referral-link";
import type { Announcement, Subscription } from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

type GigRow = Announcement & { interests: { count: number }[] };

function isActive(subscription: Subscription | null) {
  return subscription?.status === "active";
}

export default async function ShopDashboardPage() {
  const { shop } = await requireShop();
  const supabase = await createClient();

  const [{ data: gigData }, { data: subscriptionData }] = await Promise.all([
    supabase
      .from("announcements")
      .select("*, interests(count)")
      .eq("shop_id", shop.id)
      .order("starts_at", { ascending: false }),
    supabase.from("subscriptions").select("*").eq("shop_id", shop.id).maybeSingle(),
  ]);

  const gigs = (gigData ?? []) as unknown as GigRow[];
  const subscription = subscriptionData as Subscription | null;
  const subscribed = isActive(subscription);

  const openCount = gigs.filter((g) => g.status === "open").length;
  const pendingApplicants = gigs.reduce((sum, gig) => sum + (gig.interests[0]?.count ?? 0), 0);

  // Referred shops may live in other cities, so the RLS-scoped client would
  // undercount them. The service role sees them all; without it, show none.
  let referredCount = 0;
  if (hasAdminClient()) {
    const { count } = await createAdminClient()
      .from("coffee_shops")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", shop.id);
    referredCount = count ?? 0;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{shop.name}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {openCount} open {openCount === 1 ? "gig" : "gigs"} · {pendingApplicants}{" "}
            {pendingApplicants === 1 ? "application" : "applications"}
          </p>
        </div>
        {subscribed ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/cafe/gigs/new"
              className="pressable inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> Post a gig
            </Link>
            <Link
              href="/cafe/jobs/new"
              className="pressable inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted"
            >
              <Briefcase className="size-4" /> Post a job
            </Link>
          </div>
        ) : null}
      </div>

      {!subscribed ? (
        <div className="rise-in mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-accent/30 bg-accent-soft/50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" />
            <div>
              <p className="font-medium">Activate your subscription to post gigs</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Unlimited gigs, applicant messaging, one flat monthly price.
              </p>
            </div>
          </div>
          <Link
            href="/settings/billing"
            className="pressable inline-flex h-9 items-center rounded-sm bg-accent px-4 text-[13px] font-medium text-accent-foreground hover:bg-accent/90"
          >
            Set up billing
          </Link>
        </div>
      ) : null}

      {gigs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No gigs yet"
          description={
            subscribed
              ? "Post your first gig and baristas in your city will see it instantly."
              : "Once billing is set up, your gigs will show up here."
          }
        />
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {gigs.map((gig) => {
            const applicants = gig.interests[0]?.count ?? 0;
            return (
              <li key={gig.id}>
                <Link
                  href={`/cafe/gigs/${gig.id}`}
                  className="pressable block rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="flex min-w-0 items-center gap-2 truncate font-display text-lg font-semibold tracking-tight">
                      {gig.is_sos ? <Badge tone="danger">SOS</Badge> : null}
                      {gig.title}
                    </h2>
                    <GigStatusBadge status={gig.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-4" />
                      {formatGigSchedule(gig)}
                    </span>
                    <span>{formatPay(gig.pay_rate_cents, gig.pay_type)}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" />
                      {applicants} {applicants === 1 ? "applicant" : "applicants"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Card className="rise-in mt-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">Refer a café</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Know a café that needs extra hands? Share your link — when they subscribe, you get a
          month free.
        </p>
        <div className="mt-4">
          <ReferralLink code={shop.referral_code} />
        </div>
        {referredCount > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {referredCount} {referredCount === 1 ? "café" : "cafés"} joined with your link
          </p>
        ) : null}
      </Card>
    </div>
  );
}
