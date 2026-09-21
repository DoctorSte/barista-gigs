import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { requireExtra } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { MySchedule, type ScheduleCafe } from "@/components/my-schedule";
import { dateKey, mondayOf, addDays, weekDays } from "@/lib/planner";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "My schedule" };

// The staff side of the planner: baristas linked to a café's roster see their
// rota here and mark days off. Reads run under their own RLS.
export default async function SchedulePage() {
  const { user } = await requireExtra();
  const supabase = await createClient();
  const d = await getDict();

  const { data: staffRows } = await supabase
    .from("cafe_staff")
    .select("id, shop_id, name, weekly_hours_target")
    .eq("user_id", user.id);
  const rows = staffRows ?? [];

  const cafes: ScheduleCafe[] = [];
  if (rows.length > 0) {
    const staffIds = rows.map((row) => row.id);
    const today = dateKey(new Date());
    const horizon = dateKey(addDays(new Date(), 14));
    const thisWeek = weekDays(dateKey(mondayOf(new Date())));

    const [{ data: shiftData }, { data: offData }] = await Promise.all([
      supabase
        .from("planner_shifts")
        .select("id, staff_id, date, start_min, end_min, note")
        .in("staff_id", staffIds)
        .gte("date", thisWeek[0]!)
        .lte("date", horizon)
        .order("date")
        .order("start_min"),
      supabase
        .from("staff_time_off")
        .select("id, staff_id, date, note")
        .in("staff_id", staffIds)
        .gte("date", today)
        .order("date"),
    ]);

    // Shop names via the service role — the shop may not be city-visible to
    // this barista, but they work there.
    const shopNames = new Map<string, string>();
    if (hasAdminClient()) {
      const { data: shops } = await createAdminClient()
        .from("coffee_shops")
        .select("id, name")
        .in("id", rows.map((row) => row.shop_id));
      for (const shop of shops ?? []) shopNames.set(shop.id, shop.name);
    }

    for (const row of rows) {
      const shifts = (shiftData ?? []).filter((shift) => shift.staff_id === row.id);
      const weekSet = new Set(thisWeek);
      cafes.push({
        staffId: row.id,
        cafeName: shopNames.get(row.shop_id) ?? "Café",
        weeklyHoursTarget: row.weekly_hours_target,
        weekMinutes: shifts
          .filter((shift) => weekSet.has(shift.date))
          .reduce(
            (sum, shift) =>
              sum +
              (shift.end_min > shift.start_min
                ? shift.end_min - shift.start_min
                : shift.end_min + 1440 - shift.start_min),
            0,
          ),
        upcoming: shifts
          .filter((shift) => shift.date >= today)
          .map((shift) => ({
            id: shift.id,
            date: shift.date,
            startMin: shift.start_min,
            endMin: shift.end_min,
            note: shift.note,
          })),
        timeOff: (offData ?? [])
          .filter((off) => off.staff_id === row.id)
          .map((off) => ({ id: off.id, date: off.date, note: off.note })),
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{d.schedule.title}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{d.schedule.subtitle}</p>
      </div>

      {cafes.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {d.schedule.empty}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{d.schedule.emptySub}</p>
        </div>
      ) : (
        <MySchedule cafes={cafes} />
      )}
    </div>
  );
}
