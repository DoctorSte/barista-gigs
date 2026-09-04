import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { AcceptInviteButton } from "@/components/accept-invite-button";

export const metadata: Metadata = { title: "Join a café team" };

export default async function TeamJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { user } = await getSession();
  if (!user) redirect(`/login?next=/team/join/${token}`);

  let invalid = !hasAdminClient();
  let cafeName: string | null = null;
  if (hasAdminClient()) {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("cafe_invites")
      .select("owner_id, accepted_at")
      .eq("token", token)
      .maybeSingle();
    if (!invite || invite.accepted_at) {
      invalid = true;
    } else {
      const { data: shop } = await admin
        .from("coffee_shops")
        .select("name")
        .eq("owner_id", invite.owner_id)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      cafeName = shop?.name ?? null;
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent-soft">
        <Users className="size-5 text-accent" />
      </div>
      {invalid ? (
        <>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
            This invite isn&apos;t valid
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            The link may have been revoked or already used. Ask the café owner to send a new one.
          </p>
          <Link
            href="/"
            className="mt-6 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Back to Barista Gigs
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
            Join {cafeName ?? "the café"}&apos;s team
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            You&apos;ll share the café workspace — gigs, applicants, and messages — as{" "}
            {user.email}. Billing and locations stay with the owner.
          </p>
          <div className="mt-6">
            <AcceptInviteButton token={token} />
          </div>
        </>
      )}
    </div>
  );
}
