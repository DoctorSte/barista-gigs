import type { Metadata } from "next";
import { getOwnerSubscription, requireShop } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDays, dateKey, fromDateKey, parseWeekParam, toHHMM, weekDays } from "@/lib/planner";
import { PlannerGrid, type PlannerBlock, type PlannerData } from "@/components/planner-grid";
import type { Announcement, CafeStaff, PlannerShift } from "@/lib/database.types";

export const metadata: Metadata = { title: "Planner" };

type BaristaJoin = {
  id: string;
  hourly_rate_cents: number | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
} | null;

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const [{ shop }, params] = await Promise.all([requireShop(), searchParams]);
  const supabase = await createClient();
  const subscription = await getOwnerSubscription();

  const weekStart = parseWeekParam(params.week);
  const days = weekDays(weekStart);
  const daySet = new Set(days);
  // Widen the DB window by a day on each side (starts_at/ends_at are UTC
  // timestamps spanning all of a gig's shifts) and trim precisely by date key.
  const windowStart = addDays(fromDateKey(days[0]!), -1).toISOString();
  const windowEnd = addDays(fromDateKey(days[6]!), 2).toISOString();

  const [{ data: gigData }, { data: staffData }, { data: internalData }] = await Promise.all([
    supabase
      .from("announcements")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("kind", "shift")
      .neq("status", "draft")
      .lt("starts_at", windowEnd)
      .gt("ends_at", windowStart),
    supabase.from("cafe_staff").select("*").eq("shop_id", shop.id).order("created_at"),
    supabase
      .from("planner_shifts")
      .select("*")
      .eq("shop_id", shop.id)
      .in("date", days)
      .order("start_min"),
  ]);

  const gigs = (gigData ?? []) as Announcement[];
  const staff = (staffData ?? []) as CafeStaff[];
  const internalShifts = (internalData ?? []) as PlannerShift[];

  // Applicants for the visible gigs: accepted → assignees, pending → count.
  const gigIds = gigs.map((gig) => gig.id);
  const { data: interestData } = gigIds.length
    ? await supabase
        .from("interests")
        .select(
          "announcement_id, status, extras_profiles:extra_id(id, hourly_rate_cents, profiles:user_id(display_name, avatar_url))",
        )
        .in("announcement_id", gigIds)
    : { data: [] };
  const interestRows = (interestData ?? []) as unknown as {
    announcement_id: string;
    status: string;
    extras_profiles: BaristaJoin;
  }[];

  // Roster: baristas ever accepted at this café + saved baristas.
  const [{ data: acceptedData }, { data: savedData }] = await Promise.all([
    supabase
      .from("interests")
      .select(
        "extras_profiles:extra_id(id, hourly_rate_cents, profiles:user_id(display_name, avatar_url)), announcements!inner(shop_id)",
      )
      .eq("status", "accepted")
      .eq("announcements.shop_id", shop.id),
    supabase
      .from("saved_baristas")
      .select("extras_profiles:extra_id(id, hourly_rate_cents, profiles:user_id(display_name, avatar_url))")
      .eq("shop_id", shop.id),
  ]);

  const baristaMap = new Map<
    string,
    { extraId: string; name: string; avatarUrl: string | null; hourlyRateCents: number | null }
  >();
  function addBarista(join: BaristaJoin) {
    if (!join || baristaMap.has(join.id)) return;
    baristaMap.set(join.id, {
      extraId: join.id,
      name: join.profiles?.display_name ?? "Barista",
      avatarUrl: join.profiles?.avatar_url ?? null,
      hourlyRateCents: join.hourly_rate_cents,
    });
  }
  for (const row of (acceptedData ?? []) as unknown as { extras_profiles: BaristaJoin }[]) {
    addBarista(row.extras_profiles);
  }
  for (const row of (savedData ?? []) as unknown as { extras_profiles: BaristaJoin }[]) {
    addBarista(row.extras_profiles);
  }
  for (const row of interestRows) if (row.status === "accepted") addBarista(row.extras_profiles);

  const assigneesByGig = new Map<string, string[]>();
  const pendingByGig = new Map<string, number>();
  for (const row of interestRows) {
    if (row.status === "accepted" && row.extras_profiles) {
      assigneesByGig.set(row.announcement_id, [
        ...(assigneesByGig.get(row.announcement_id) ?? []),
        row.extras_profiles.id,
      ]);
    } else if (row.status === "pending") {
      pendingByGig.set(row.announcement_id, (pendingByGig.get(row.announcement_id) ?? 0) + 1);
    }
  }

  const blocks: PlannerBlock[] = [];
  for (const gig of gigs) {
    gig.shifts.forEach((shift, index) => {
      if (!daySet.has(shift.date)) return;
      blocks.push({
        id: `${gig.id}:${index}`,
        kind: "gig",
        date: shift.date,
        start: shift.start,
        end: shift.end,
        title: gig.title,
        gigId: gig.id,
        shiftIndex: index,
        status: gig.status,
        isSos: gig.is_sos,
        pendingApplicants: pendingByGig.get(gig.id) ?? 0,
        assigneeExtraIds: assigneesByGig.get(gig.id) ?? [],
        shiftCount: gig.shifts.length,
        allShifts: gig.shifts,
        description: gig.description,
        payRateCents: gig.pay_rate_cents,
        payType: gig.pay_type,
        requiredSkills: gig.required_skills,
      });
    });
  }
  for (const shift of internalShifts) {
    blocks.push({
      id: `ps:${shift.id}`,
      kind: "internal",
      date: shift.date,
      start: toHHMM(shift.start_min),
      end: toHHMM(shift.end_min === 1440 ? 0 : shift.end_min),
      title: shift.note ?? "",
      staffId: shift.staff_id,
      plannerShiftId: shift.id,
      note: shift.note,
    });
  }

  const data: PlannerData = {
    weekStart,
    days,
    todayKey: dateKey(new Date()),
    subscribed: subscription?.status === "active",
    shopName: shop.name,
    openingHours: shop.opening_hours,
    blocks,
    baristas: [...baristaMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    staff: staff.map((s) => ({ id: s.id, name: s.name })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PlannerGrid data={data} />
    </div>
  );
}
