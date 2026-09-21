import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { StaffManager, type StaffRow } from "@/components/staff-manager";
import { getDict } from "@/lib/i18n";
import type { CafeStaff } from "@/lib/database.types";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const { shop } = await requireShop();
  const supabase = await createClient();
  const d = await getDict();

  const { data } = await supabase
    .from("cafe_staff")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at");
  const staff = (data ?? []) as CafeStaff[];

  // Linked account names come via the service role — a café teammate's client
  // may not be allowed to read an arbitrary profile row.
  const linkedNames = new Map<string, { name: string; avatarUrl: string | null }>();
  const linkedIds = staff.map((s) => s.user_id).filter((id): id is string => Boolean(id));
  if (linkedIds.length > 0 && hasAdminClient()) {
    const { data: profiles } = await createAdminClient()
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", linkedIds);
    for (const p of profiles ?? []) {
      linkedNames.set(p.id, { name: p.display_name, avatarUrl: p.avatar_url });
    }
  }

  const rows: StaffRow[] = staff.map((s) => ({
    id: s.id,
    name: s.name,
    weeklyHoursTarget: s.weekly_hours_target,
    defaultWeek: s.default_week ?? [],
    linked: s.user_id
      ? {
          name: linkedNames.get(s.user_id)?.name ?? s.name,
          avatarUrl: linkedNames.get(s.user_id)?.avatarUrl ?? null,
        }
      : null,
    inviteEmail: s.invite_email,
    invitePending: Boolean(s.invite_token),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{d.staff.title}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{d.staff.subtitle}</p>
        </div>
        <Link
          href="/cafe/planner"
          className="pressable inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-sm font-medium hover:bg-muted"
        >
          <CalendarDays className="size-4" /> {d.staff.toPlanner}
        </Link>
      </div>

      <StaffManager staff={rows} openingHours={shop.opening_hours} />
    </div>
  );
}
