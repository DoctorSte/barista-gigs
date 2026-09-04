import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, CalendarClock, ClipboardList, Plus, Sparkles, Users } from "lucide-react";
import { getOwnerShops, getOwnerSubscription, requireShop } from "@/lib/auth";
import { PLANS, isPlanId } from "@/lib/plans";
import { LocationSwitcher } from "@/components/location-switcher";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatGigSchedule, formatPay } from "@/lib/format";
import { Badge, GigStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReferralLink } from "@/components/referral-link";
import { TeamManager, type TeamInviteRow, type TeamMemberRow } from "@/components/team-manager";
import type { Announcement, Subscription } from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

type GigRow = Announcement & { interests: { count: number }[] };

function isActive(subscription: Subscription | null) {
  return subscription?.status === "active";
}

export default async function ShopDashboardPage() {
  const { user, shop } = await requireShop();
  const supabase = await createClient();

  const [{ data: gigData }, subscription, shops] = await Promise.all([
    supabase
      .from("announcements")
      .select("*, interests(count)")
      .eq("shop_id", shop.id)
      .order("starts_at", { ascending: false }),
    getOwnerSubscription(),
    getOwnerShops(),
  ]);

  const gigs = (gigData ?? []) as unknown as GigRow[];
  const subscribed = isActive(subscription);
  const plan = PLANS[isPlanId(subscription?.plan) ? subscription!.plan : "regular"];
  const canAddLocation = subscribed && shops.length < plan.locations;
  const showSwitcher = shops.length > 1 || canAddLocation || (subscribed && plan.locations === 1);

  const openCount = gigs.filter((g) => g.status === "open").length;
  const pendingApplicants = gigs.reduce((sum, gig) => sum + (gig.interests[0]?.count ?? 0), 0);

  // Referred shops may live in other cities, so the RLS-scoped client would
  // undercount them. The service role sees them all; without it, show none.
  let referred: { id: string; name: string; created_at: string; referral_reward_granted: boolean }[] =
    [];
  if (hasAdminClient()) {
    const { data: referredData } = await createAdminClient()
      .from("coffee_shops")
      .select("id, name, created_at, referral_reward_granted")
      .eq("referred_by", shop.id)
      .order("created_at", { ascending: false });
    referred = (referredData ?? []) as typeof referred;
  }
  const freeMonths = referred.filter((r) => r.referral_reward_granted).length;

  // Team management is owner-only; members see the workspace without this card.
  const isOwner = shops[0]?.owner_id === user.id;
  let teamMembers: TeamMemberRow[] = [];
  let teamInvites: TeamInviteRow[] = [];
  if (isOwner && hasAdminClient()) {
    const admin = createAdminClient();
    const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
      admin.from("cafe_members").select("member_id").eq("owner_id", user.id),
      admin
        .from("cafe_invites")
        .select("id, email")
        .eq("owner_id", user.id)
        .is("accepted_at", null)
        .order("created_at"),
    ]);
    const memberIds = (memberRows ?? []).map((row) => row.member_id);
    if (memberIds.length > 0) {
      const { data: profileRows } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", memberIds);
      const names = new Map((profileRows ?? []).map((p) => [p.id, p.display_name]));
      teamMembers = await Promise.all(
        memberIds.map(async (id) => {
          const { data } = await admin.auth.admin.getUserById(id);
          return { id, name: names.get(id) ?? "Team member", email: data?.user?.email ?? null };
        }),
      );
    }
    teamInvites = (inviteRows ?? []) as TeamInviteRow[];
  }
  const teamSeatsUsed = 1 + teamMembers.length + teamInvites.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {showSwitcher ? (
        <LocationSwitcher
          locations={shops.map((s) => ({ id: s.id, name: s.name }))}
          activeId={shop.id}
          canAdd={canAddLocation}
          upgradeHint={subscribed && !canAddLocation && plan.id !== "group"}
        />
      ) : null}
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

      {isOwner && subscribed ? (
        <Card className="rise-in mt-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Teammates share this workspace — gigs, applicants, and messages — across all your
            locations. Billing, locations, and the team itself stay with you.
          </p>
          <TeamManager
            members={teamMembers}
            invites={teamInvites}
            seatCap={plan.teamAccounts}
            planName={plan.name}
            canInviteMore={teamSeatsUsed < plan.teamAccounts}
          />
        </Card>
      ) : null}

      <Card className="rise-in mt-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">Refer a café</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Know a café that needs extra hands? Share your link — when they subscribe, you get a
          month free.
        </p>
        <div className="mt-4">
          <ReferralLink code={shop.referral_code} />
        </div>
        {referred.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm font-medium">
              {referred.length} {referred.length === 1 ? "café" : "cafés"} joined with your link
              {freeMonths > 0
                ? ` · ${freeMonths} free ${freeMonths === 1 ? "month" : "months"} earned`
                : ""}
            </p>
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {referred.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3.5 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    {r.name}
                    <span className="text-[12px] text-muted-foreground">
                      joined {formatDate(r.created_at)}
                    </span>
                  </span>
                  {r.referral_reward_granted ? (
                    <Badge tone="success">Free month earned</Badge>
                  ) : (
                    <Badge>Not subscribed yet</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
