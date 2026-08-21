import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, MessageSquare, Send } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatGigSchedule, formatPay, formatRelative } from "@/lib/format";
import { InterestStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { Announcement, Interest } from "@/lib/database.types";

export const metadata: Metadata = { title: "My applications" };

type InterestRow = Interest & {
  announcements: (Announcement & { coffee_shops: { name: string } | null }) | null;
};

export default async function ApplicationsPage() {
  const { extra } = await requireExtra();
  const supabase = await createClient();

  const [{ data: interestData }, { data: conversationData }] = await Promise.all([
    supabase
      .from("interests")
      .select("*, announcements(*, coffee_shops(name))")
      .eq("extra_id", extra.id)
      .order("created_at", { ascending: false }),
    supabase.from("conversations").select("id, announcement_id").eq("extra_id", extra.id),
  ]);

  const interests = (interestData ?? []) as unknown as InterestRow[];
  const conversationByGig = new Map(
    (conversationData ?? []).map((c) => [c.announcement_id, c.id]),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">My applications</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Every gig you&apos;ve raised your hand for.
        </p>
      </div>

      {interests.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No applications yet"
          description="Browse open gigs in your city and send your first application."
          action={
            <Link href="/gigs">
              <Button variant="outline">Browse gigs</Button>
            </Link>
          }
        />
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {interests.map((interest) => {
            const gig = interest.announcements;
            const conversationId = conversationByGig.get(interest.announcement_id);
            return (
              <li
                key={interest.id}
                className="rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      {gig?.coffee_shops?.name ?? "Coffee shop"} · applied{" "}
                      {formatRelative(interest.created_at)}
                    </p>
                    {gig ? (
                      <Link
                        href={`/gigs/${gig.id}`}
                        className="mt-0.5 block font-display text-lg font-semibold tracking-tight transition-colors duration-150 hover:text-accent"
                      >
                        {gig.title}
                      </Link>
                    ) : (
                      <p className="mt-0.5 font-display text-lg font-semibold">Gig removed</p>
                    )}
                  </div>
                  <InterestStatusBadge status={interest.status} />
                </div>
                {gig ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    {formatGigSchedule(gig)} ·{" "}
                    {formatPay(gig.pay_rate_cents, gig.pay_type)}
                  </p>
                ) : null}
                {interest.status === "accepted" && conversationId ? (
                  <Link
                    href={`/messages/${conversationId}`}
                    className="pressable mt-3 inline-flex items-center gap-1.5 rounded-sm bg-success-soft px-3 py-1.5 text-[13px] font-medium text-success"
                  >
                    <MessageSquare className="size-4" /> Message the café
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
