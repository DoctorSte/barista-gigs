import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getSession } from "@/lib/auth";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { AcceptStaffInviteButton } from "@/components/accept-staff-invite-button";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Join a staff planner" };

export default async function StaffJoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { user } = await getSession();
  if (!user) redirect(`/login?next=/staff/join/${token}`);
  const d = await getDict();

  let cafeName: string | null = null;
  if (hasAdminClient()) {
    const admin = createAdminClient();
    const { data: staffRow } = await admin
      .from("cafe_staff")
      .select("shop_id, user_id")
      .eq("invite_token", token)
      .maybeSingle();
    if (staffRow && !staffRow.user_id) {
      const { data: shop } = await admin
        .from("coffee_shops")
        .select("name")
        .eq("id", staffRow.shop_id)
        .maybeSingle();
      cafeName = shop?.name ?? null;
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CalendarDays className="size-5 text-muted-foreground" />
      </div>
      {!cafeName ? (
        <>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
            {d.schedule.join.invalidTitle}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{d.schedule.join.invalidBody}</p>
          <Link
            href="/"
            className="mt-6 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Barista Gigs
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
            {d.schedule.join.title(cafeName)}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{d.schedule.join.body}</p>
          <div className="mt-6">
            <AcceptStaffInviteButton token={token} label={d.schedule.join.accept} />
          </div>
        </>
      )}
    </div>
  );
}
